from __future__ import annotations

from typing import Any

from apps.audit.services import audit_for_application
from apps.workflow.states import DRAFT, STAGES, STATUS_FOR_STAGE
from irms import repository as repo
from irms.exceptions import NotFound, WorkflowError

from .forms import is_enabled


def _snapshot_facility(facility: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": facility["id"],
        "name": facility.get("name", ""),
        "type": facility.get("type", ""),
        "address": facility.get("address", ""),
        "province": facility.get("province", ""),
        "district": facility.get("district", ""),
        "pacra_number": facility.get("pacra_number", ""),
        "rpo": facility.get("rpo"),
    }


def create_application(*, actor: Any, form_type: str, facility_id: str) -> dict[str, Any]:
    if not is_enabled(form_type):
        raise WorkflowError(f"form type '{form_type}' is not enabled in this phase")
    facility = repo.doc("facilities", facility_id)
    if not facility:
        raise NotFound("facility not found")
    if facility.get("owner_uid") != actor.uid:
        raise WorkflowError("you do not own this facility")
    app_id = repo.create_doc("applications", {
        "form_type": form_type,
        "applicant_uid": actor.uid,
        "facility_id": facility_id,
        "facility_snapshot": _snapshot_facility(facility),
        "current_stage": DRAFT,
        "status": STATUS_FOR_STAGE[DRAFT],
        "assigned_to_uid": "",
        "wizard_data": {},
    })
    audit_for_application(
        application_id=app_id, actor=actor, action="application.created",
        from_stage="", to_stage=DRAFT,
    )
    return repo.doc("applications", app_id)  # type: ignore[return-value]


def update_wizard(*, actor: Any, app_id: str, step: int, data: dict[str, Any]) -> dict[str, Any]:
    app = repo.doc("applications", app_id)
    if not app:
        raise NotFound("application not found")
    if app.get("applicant_uid") != actor.uid:
        raise WorkflowError("only the applicant may edit this application")
    if app.get("current_stage") not in {DRAFT, "info_requested"}:
        raise WorkflowError("application is not editable in its current state")
    wizard = dict(app.get("wizard_data") or {})
    wizard[f"step_{step}"] = data
    repo.update_doc("applications", app_id, {"wizard_data": wizard})
    return repo.doc("applications", app_id)  # type: ignore[return-value]


def list_for_applicant(uid: str) -> list[dict[str, Any]]:
    return repo.list_docs(
        "applications",
        where=[("applicant_uid", "==", uid)],
        order_by="updated_at", descending=True,
    )


def list_for_staff(*, role: str, assigned_to_uid: str | None = None,
                   stage: str | None = None) -> list[dict[str, Any]]:
    """Staff queue: applications at any stage approvable by the role.

    Stage and assignee filters are honoured if provided.
    """
    stages_for_role = [s.key for s in STAGES.values() if role in s.approver_roles]
    if stage and stage in stages_for_role:
        stages_for_role = [stage]
    if not stages_for_role:
        return []
    out: list[dict[str, Any]] = []
    for s in stages_for_role:
        where = [("current_stage", "==", s)]
        if assigned_to_uid:
            where.append(("assigned_to_uid", "==", assigned_to_uid))
        out.extend(repo.list_docs("applications", where=where, order_by="submitted_at"))
    return out


def get_audit_trail(app_id: str) -> list[dict[str, Any]]:
    return repo.subcollection_list(
        "applications", app_id, "audit", order_by="timestamp",
    )
