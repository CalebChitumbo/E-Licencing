from __future__ import annotations

import logging
from datetime import date
from typing import Any

from django.conf import settings

from apps.audit.services import audit
from apps.documents import storage as docstorage
from apps.workflow import services as workflow
from apps.workflow.states import ED_APPROVAL
from irms import repository as repo
from irms.exceptions import NotFound, WorkflowError

from . import numbering
from .pdf import default_expiry, render_licence_pdf

logger = logging.getLogger("irms.licences")


def generate_licence_for_application(*, app_id: str, actor: Any) -> dict[str, Any]:
    app = repo.doc("applications", app_id)
    if not app:
        raise NotFound("application not found")
    if app.get("current_stage") != ED_APPROVAL:
        raise WorkflowError(
            f"licence can only be generated from stage '{ED_APPROVAL}' "
            f"(currently '{app.get('current_stage')}')"
        )

    number = numbering.next_licence_number()
    issued = date.today()
    expires = default_expiry(issued)
    licence: dict[str, Any] = {
        "licence_number": number,
        "application_id": app_id,
        "holder_uid": app.get("applicant_uid", ""),
        "holder_name": (app.get("facility_snapshot") or {}).get("name", ""),
        "facility_snapshot": app.get("facility_snapshot") or {},
        "issued_at": issued.isoformat(),
        "expires_at": expires.isoformat(),
        "conditions": _default_conditions(),
        "status": "active",
        "digital_signature_info": {
            "signed_by": getattr(actor, "uid", "ed"),
            "signed_at_iso": issued.isoformat(),
            "method": "rpa-stamped-v0",
        },
    }

    try:
        pdf_bytes = render_licence_pdf(licence)
        storage_path = f"licences/{number}.pdf"
        docstorage.upload_bytes(path=storage_path, data=pdf_bytes, content_type="application/pdf")
        licence["pdf_storage_path"] = storage_path
    except Exception:
        logger.exception("PDF render failed for licence %s", number)
        licence["pdf_storage_path"] = ""

    repo.set_doc("licences", number, licence)
    workflow.mark_licence_generated(app_id, actor, number)
    audit(
        actor=actor, action="licence.generated",
        target_collection="licences", target_id=number,
        details={"application_id": app_id},
    )
    return repo.doc("licences", number) or licence


def revoke_licence(number: str, *, actor: Any, reason: str) -> dict[str, Any]:
    licence = repo.doc("licences", number)
    if not licence:
        raise NotFound("licence not found")
    repo.update_doc("licences", number, {
        "status": "revoked",
        "revoked_at_iso": date.today().isoformat(),
        "revoked_reason": reason,
        "revoked_by": actor.uid,
    })
    audit(
        actor=actor, action="licence.revoked",
        target_collection="licences", target_id=number,
        details={"reason": reason},
    )
    return repo.doc("licences", number)  # type: ignore[return-value]


def licence_download_url(number: str) -> str:
    licence = repo.doc("licences", number)
    if not licence:
        raise NotFound("licence not found")
    path = licence.get("pdf_storage_path") or ""
    if not path:
        raise NotFound("licence pdf not available")
    return docstorage.generate_signed_download_url(path=path)


def public_view(number: str) -> dict[str, Any]:
    licence = repo.doc("licences", number)
    if not licence:
        raise NotFound("licence not found")
    facility = licence.get("facility_snapshot") or {}
    return {
        "licence_number": licence["licence_number"],
        "holder_name": licence.get("holder_name", ""),
        "facility_name": facility.get("name", ""),
        "facility_district": facility.get("district", ""),
        "facility_province": facility.get("province", ""),
        "issued_at": licence.get("issued_at"),
        "expires_at": licence.get("expires_at"),
        "status": licence.get("status"),
        "verify_url": f"{settings.PUBLIC_VERIFY_URL}/{number}",
    }


def _default_conditions() -> list[str]:
    return [
        "The holder shall comply with the Ionising Radiation Protection Act No. 16 of 2005 and all subsidiary regulations.",
        "Sources may only be used at the address specified in this licence and only by qualified personnel.",
        "The holder shall maintain records of all personnel monitoring, source inventory, and incident reports.",
        "Any change in ownership, location, or scope of practice must be notified to the Authority within 14 days.",
        "This licence is non-transferable.",
    ]
