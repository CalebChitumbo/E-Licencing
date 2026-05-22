"""Immutable audit trail.

Two surfaces:
  * `audit(...)` — global stream stored in the top-level `audit_logs`
    collection (used for cross-cutting events: login, role changes, admin
    actions).
  * `audit_for_application(...)` — append to the `applications/{id}/audit`
    subcollection (every workflow transition lands here).

Audit writes are best-effort: a logging failure must never crash the
caller's primary operation.
"""
from __future__ import annotations

import logging
from typing import Any

from irms import repository as repo

logger = logging.getLogger("irms.audit")


def audit(
    *,
    actor: Any,
    action: str,
    target_collection: str = "",
    target_id: str = "",
    details: dict[str, Any] | None = None,
) -> None:
    try:
        repo.create_doc(
            "audit_logs",
            {
                "actor_uid": getattr(actor, "uid", "system"),
                "actor_role": getattr(actor, "role", "system"),
                "action": action,
                "target_collection": target_collection,
                "target_id": target_id,
                "details": details or {},
                "timestamp": repo.now(),
            },
        )
    except Exception:
        logger.exception("audit log write failed: action=%s", action)


def audit_for_application(
    *,
    application_id: str,
    actor: Any,
    action: str,
    from_stage: str = "",
    to_stage: str = "",
    reason: str = "",
    details: dict[str, Any] | None = None,
) -> None:
    try:
        repo.subcollection_add(
            "applications",
            application_id,
            "audit",
            {
                "actor_uid": getattr(actor, "uid", "system"),
                "actor_role": getattr(actor, "role", "system"),
                "action": action,
                "from_stage": from_stage,
                "to_stage": to_stage,
                "reason": reason,
                "details": details or {},
                "timestamp": repo.now(),
            },
        )
    except Exception:
        logger.exception("application audit failed: app=%s action=%s", application_id, action)
