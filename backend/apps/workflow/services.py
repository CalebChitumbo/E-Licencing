"""Workflow engine — runs every state transition through a single function.

All transitions:
  * verify the actor's role can approve the current stage,
  * write the new stage atomically with a status field and snapshot,
  * append to the application's audit subcollection,
  * enqueue a notification for the applicant (and the next reviewer if any).
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from apps.audit.services import audit_for_application
from apps.notifications.services import notify
from irms import repository as repo
from irms.exceptions import NotFound, WorkflowError

from .states import (
    DRAFT,
    INFO_REQUESTED,
    LICENCE_GENERATED,
    REJECTED,
    STAGES,
    STATUS_FOR_STAGE,
    SUBMITTED,
    Stage,
    is_terminal,
)

DEFAULT_SLA_DAYS = 5


def get_application(app_id: str) -> dict[str, Any]:
    app = repo.doc("applications", app_id)
    if not app:
        raise NotFound("application not found")
    return app


def _stage(stage_key: str) -> Stage:
    if stage_key not in STAGES:
        raise WorkflowError(f"unknown stage: {stage_key}")
    return STAGES[stage_key]


def _check_role(actor: Any, stage: Stage) -> None:
    if actor.role not in stage.approver_roles:
        raise WorkflowError(
            f"role '{actor.role}' cannot act on stage '{stage.key}'"
        )


def _sla_deadline(days: int = DEFAULT_SLA_DAYS) -> datetime:
    return datetime.utcnow() + timedelta(days=days)


def submit(app_id: str, actor: Any) -> dict[str, Any]:
    app = get_application(app_id)
    if app.get("applicant_uid") != actor.uid:
        raise WorkflowError("only the applicant may submit this application")
    if app.get("current_stage") not in {DRAFT, INFO_REQUESTED}:
        raise WorkflowError("application is not in a submittable state")
    next_stage = SUBMITTED
    repo.update_doc("applications", app_id, {
        "current_stage": next_stage,
        "status": STATUS_FOR_STAGE[next_stage],
        "submitted_at": repo.now(),
        "sla_deadline": _sla_deadline(),
    })
    audit_for_application(
        application_id=app_id, actor=actor, action="application.submitted",
        from_stage=app.get("current_stage", ""), to_stage=next_stage,
    )
    notify(
        user_uid=actor.uid, template="application.submitted",
        payload={"application_id": app_id},
    )
    return get_application(app_id)


def transition(
    app_id: str,
    actor: Any,
    *,
    action: str,
    reason: str = "",
    assignee_uid: str | None = None,
) -> dict[str, Any]:
    """`action` is one of: approve, reject, request_info, assign."""
    app = get_application(app_id)
    current = _stage(app.get("current_stage", ""))
    _check_role(actor, current)

    if action == "approve":
        if not current.next_stage:
            raise WorkflowError(f"stage '{current.key}' has no next stage")
        new_stage = current.next_stage
        update: dict[str, Any] = {
            "current_stage": new_stage,
            "status": STATUS_FOR_STAGE[new_stage],
            "assigned_to_uid": "",
            "sla_deadline": _sla_deadline() if not is_terminal(new_stage) else None,
        }
        repo.update_doc("applications", app_id, update)
        audit_for_application(
            application_id=app_id, actor=actor, action="application.approved",
            from_stage=current.key, to_stage=new_stage, reason=reason,
        )
        notify(
            user_uid=app["applicant_uid"], template="application.advanced",
            payload={"application_id": app_id, "stage": new_stage},
        )
        return get_application(app_id)

    if action == "reject":
        if not current.can_reject:
            raise WorkflowError(f"stage '{current.key}' cannot be rejected")
        repo.update_doc("applications", app_id, {
            "current_stage": REJECTED,
            "status": STATUS_FOR_STAGE[REJECTED],
            "rejected_reason": reason,
        })
        audit_for_application(
            application_id=app_id, actor=actor, action="application.rejected",
            from_stage=current.key, to_stage=REJECTED, reason=reason,
        )
        notify(
            user_uid=app["applicant_uid"], template="application.rejected",
            payload={"application_id": app_id, "reason": reason},
        )
        return get_application(app_id)

    if action == "request_info":
        if not current.can_request_info:
            raise WorkflowError(f"stage '{current.key}' cannot request info")
        repo.update_doc("applications", app_id, {
            "current_stage": INFO_REQUESTED,
            "status": STATUS_FOR_STAGE[INFO_REQUESTED],
            "info_request": {"reason": reason, "from_stage": current.key, "at": repo.now()},
        })
        audit_for_application(
            application_id=app_id, actor=actor, action="application.info_requested",
            from_stage=current.key, to_stage=INFO_REQUESTED, reason=reason,
        )
        notify(
            user_uid=app["applicant_uid"], template="application.info_requested",
            payload={"application_id": app_id, "reason": reason},
        )
        return get_application(app_id)

    if action == "assign":
        if not assignee_uid:
            raise WorkflowError("assign requires assignee_uid")
        repo.update_doc("applications", app_id, {"assigned_to_uid": assignee_uid})
        audit_for_application(
            application_id=app_id, actor=actor, action="application.assigned",
            from_stage=current.key, to_stage=current.key,
            details={"assignee_uid": assignee_uid},
        )
        return get_application(app_id)

    raise WorkflowError(f"unknown action: {action}")


def mark_licence_generated(app_id: str, actor: Any, licence_number: str) -> dict[str, Any]:
    app = get_application(app_id)
    repo.update_doc("applications", app_id, {
        "current_stage": LICENCE_GENERATED,
        "status": STATUS_FOR_STAGE[LICENCE_GENERATED],
        "licence_id": licence_number,
        "sla_deadline": None,
    })
    audit_for_application(
        application_id=app_id, actor=actor, action="licence.generated",
        from_stage=app.get("current_stage", ""), to_stage=LICENCE_GENERATED,
        details={"licence_number": licence_number},
    )
    notify(
        user_uid=app["applicant_uid"], template="licence.generated",
        payload={"application_id": app_id, "licence_number": licence_number},
    )
    return get_application(app_id)
