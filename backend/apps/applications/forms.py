"""Form type registry.

For Phase 1 only Form I (new licence) is enabled. The other form types are
defined here so the wizard data shape is fixed up front; the UI exposes them
in Phase 2.
"""
from __future__ import annotations

FORM_TYPES = {
    "FORM_I":   {"label": "New Licence",                 "enabled": True},
    "FORM_V":   {"label": "Renewal of Licence",          "enabled": False},
    "FORM_VI":  {"label": "Amendment of Licence",        "enabled": False},
    "FORM_VIII":{"label": "Transfer of Licence",         "enabled": False},
    "FORM_IX":  {"label": "Authorisation of Activities", "enabled": False},
    "FORM_XIII":{"label": "Authorisation of Practice",   "enabled": False},
}


def is_enabled(form_type: str) -> bool:
    return FORM_TYPES.get(form_type, {}).get("enabled", False)
