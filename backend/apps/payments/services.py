from __future__ import annotations

from typing import Any

from apps.audit.services import audit, audit_for_application
from apps.notifications.services import notify
from apps.workflow.states import NRSO_REVIEW, STATUS_FOR_STAGE, SUBMITTED
from irms import repository as repo
from irms.exceptions import NotFound, WorkflowError

from .fees import line_items_for


def create_invoice_for_application(application: dict[str, Any], *, actor: Any) -> dict[str, Any]:
    items = line_items_for(application)
    total = sum(i["amount"] * i["qty"] for i in items)
    invoice_id = repo.create_doc("invoices", {
        "application_id": application["id"],
        "applicant_uid": application["applicant_uid"],
        "line_items": items,
        "total": total,
        "currency": "ZMW",
        "status": "pending",
        "payment_ref": "",
        "proof_storage_path": "",
        "verified_by": "",
        "verified_at": None,
    })
    repo.update_doc("applications", application["id"], {
        "invoice_id": invoice_id, "fee_amount": total,
    })
    audit_for_application(
        application_id=application["id"], actor=actor, action="invoice.created",
        details={"invoice_id": invoice_id, "total": total},
    )
    return repo.doc("invoices", invoice_id)  # type: ignore[return-value]


def attach_proof(invoice_id: str, storage_path: str, *, actor: Any) -> dict[str, Any]:
    invoice = repo.doc("invoices", invoice_id)
    if not invoice:
        raise NotFound("invoice not found")
    if invoice.get("applicant_uid") != actor.uid:
        raise WorkflowError("only the applicant may upload proof for this invoice")
    repo.update_doc("invoices", invoice_id, {"proof_storage_path": storage_path})
    audit_for_application(
        application_id=invoice["application_id"], actor=actor, action="invoice.proof_uploaded",
        details={"invoice_id": invoice_id},
    )
    return repo.doc("invoices", invoice_id)  # type: ignore[return-value]


def verify_invoice(invoice_id: str, *, actor: Any, payment_ref: str, notes: str = "") -> dict[str, Any]:
    invoice = repo.doc("invoices", invoice_id)
    if not invoice:
        raise NotFound("invoice not found")
    if invoice.get("status") == "verified":
        raise WorkflowError("invoice already verified")

    app_id = invoice["application_id"]
    app = repo.doc("applications", app_id)
    if not app:
        raise NotFound("application missing for invoice")
    if app.get("current_stage") != SUBMITTED:
        raise WorkflowError(
            f"cannot verify payment when application is at stage '{app.get('current_stage')}'"
        )

    repo.update_doc("invoices", invoice_id, {
        "status": "verified",
        "payment_ref": payment_ref,
        "notes": notes,
        "verified_by": actor.uid,
        "verified_at": repo.now(),
    })
    repo.update_doc("applications", app_id, {
        "current_stage": NRSO_REVIEW,
        "status": STATUS_FOR_STAGE[NRSO_REVIEW],
    })
    audit_for_application(
        application_id=app_id, actor=actor, action="invoice.verified",
        from_stage=SUBMITTED, to_stage=NRSO_REVIEW,
        details={"invoice_id": invoice_id, "payment_ref": payment_ref},
    )
    audit(actor=actor, action="invoice.verified", target_collection="invoices",
          target_id=invoice_id, details={"application_id": app_id})
    notify(user_uid=app["applicant_uid"], template="payment.verified",
           payload={"application_id": app_id})
    return repo.doc("invoices", invoice_id)  # type: ignore[return-value]
