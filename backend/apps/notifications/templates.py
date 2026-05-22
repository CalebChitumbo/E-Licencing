"""Notification templates.

Each key maps to a tuple (subject, body) — `body` is a Python format string
rendered against the notification payload. SMS templates re-use `body` for
now; HTML email is a Phase 2 enhancement.
"""
from __future__ import annotations

TEMPLATES: dict[str, tuple[str, str]] = {
    "application.submitted": (
        "Your RPA application was submitted",
        "Application {application_id} has been submitted and is awaiting payment verification.",
    ),
    "application.advanced": (
        "Your RPA application has progressed",
        "Application {application_id} has advanced to stage: {stage}.",
    ),
    "application.info_requested": (
        "RPA has requested more information",
        "Application {application_id} requires further information: {reason}",
    ),
    "application.rejected": (
        "Your RPA application was not approved",
        "Application {application_id} was rejected: {reason}",
    ),
    "payment.verified": (
        "Payment verified",
        "Payment for application {application_id} has been verified. Review will continue.",
    ),
    "licence.generated": (
        "Your licence has been issued",
        "Licence {licence_number} has been issued for application {application_id}.",
    ),
    "queue.assigned": (
        "An application was assigned to you",
        "Application {application_id} has been assigned to you for review.",
    ),
}


def render(template: str, payload: dict) -> tuple[str, str]:
    subject, body = TEMPLATES.get(template, ("RPA-IRMS notification", "{message}"))
    try:
        return subject.format(**payload), body.format(**payload)
    except (KeyError, IndexError):
        return subject, body
