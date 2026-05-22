"""Notification dispatch.

For the MVP we:
  * write an in-app notification row in `notifications/`,
  * fire an email via SendGrid if configured (failures don't bubble up).

SMS is wired but disabled — the Africa's Talking client is only initialised
when credentials are present.
"""
from __future__ import annotations

import logging
from typing import Any

from django.conf import settings

from irms import repository as repo

from .templates import render

logger = logging.getLogger("irms.notifications")


def notify(*, user_uid: str, template: str, payload: dict[str, Any] | None = None,
           channels: tuple[str, ...] = ("inapp", "email")) -> str:
    payload = payload or {}
    subject, body = render(template, payload)
    notif_id = repo.create_doc("notifications", {
        "user_uid": user_uid,
        "template": template,
        "subject": subject,
        "body": body,
        "payload": payload,
        "channels": list(channels),
        "status": "queued",
        "read_at": None,
    })
    user_doc = repo.doc("users", user_uid) or {}
    if "email" in channels and user_doc.get("email") and settings.SENDGRID_API_KEY:
        _send_email_safe(user_doc["email"], subject, body)
    repo.update_doc("notifications", notif_id, {"status": "sent", "sent_at": repo.now()})
    return notif_id


def list_for_user(user_uid: str, *, limit: int = 50) -> list[dict[str, Any]]:
    return repo.list_docs(
        "notifications",
        where=[("user_uid", "==", user_uid)],
        order_by="created_at", descending=True, limit=limit,
    )


def mark_read(user_uid: str, notif_id: str) -> None:
    n = repo.doc("notifications", notif_id)
    if not n or n.get("user_uid") != user_uid:
        return
    repo.update_doc("notifications", notif_id, {"read_at": repo.now()})


def _send_email_safe(to: str, subject: str, body: str) -> None:
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=to,
            subject=subject,
            plain_text_content=body,
        )
        SendGridAPIClient(settings.SENDGRID_API_KEY).send(message)
    except Exception:
        logger.exception("email send failed: to=%s subject=%s", to, subject)
