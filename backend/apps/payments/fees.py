"""Fee schedule.

Phase 1 ships a flat default per form type, editable at runtime via the
`/admin/config/fees` endpoint (stored at `_config/fees`). Phase 2 will move
to a per-source / per-category matrix.
"""
from __future__ import annotations

from typing import Any

from irms import repository as repo

CONFIG_DOC = ("_config", "fees")

DEFAULT_FEES: dict[str, float] = {
    "FORM_I": 5000.0,
    "FORM_V": 3500.0,
    "FORM_VI": 1500.0,
    "FORM_VIII": 2000.0,
    "FORM_IX": 2500.0,
    "FORM_XIII": 4000.0,
}


def get_schedule() -> dict[str, float]:
    doc = repo.doc(*CONFIG_DOC)
    if not doc:
        repo.set_doc(*CONFIG_DOC, {"fees": DEFAULT_FEES, "currency": "ZMW"})
        return dict(DEFAULT_FEES)
    return dict(doc.get("fees") or DEFAULT_FEES)


def set_schedule(fees: dict[str, float]) -> None:
    repo.set_doc(*CONFIG_DOC, {"fees": fees, "currency": "ZMW"}, merge=True)


def fee_for(form_type: str) -> float:
    return float(get_schedule().get(form_type, 0.0))


def line_items_for(application: dict[str, Any]) -> list[dict[str, Any]]:
    form_type = application.get("form_type", "")
    amount = fee_for(form_type)
    return [{"description": f"Application fee — {form_type}", "amount": amount, "qty": 1}]
