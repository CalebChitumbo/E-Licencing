"""Firebase Storage helpers.

For real uploads we mint a v4 signed PUT URL. In emulator mode (no real
credentials) we fall back to a fake URL the frontend can recognise — the
emulator's local upload endpoint is invoked directly by the frontend instead.
"""
from __future__ import annotations

import os
from datetime import timedelta
from typing import Any
from urllib.parse import quote

from django.conf import settings


def _is_emulated() -> bool:
    return bool(os.environ.get("FIREBASE_STORAGE_EMULATOR_HOST"))


def _bucket() -> Any:
    from firebase_admin import storage as fb_storage

    name = settings.FIREBASE_STORAGE_BUCKET
    return fb_storage.bucket(name) if name else fb_storage.bucket()


def generate_signed_upload_url(*, path: str, content_type: str, expires_minutes: int = 10) -> dict:
    if _is_emulated():
        host = os.environ["FIREBASE_STORAGE_EMULATOR_HOST"]
        bucket = settings.FIREBASE_STORAGE_BUCKET or "rpa-irms-dev.appspot.com"
        return {
            "method": "POST",
            "url": f"http://{host}/v0/b/{bucket}/o?uploadType=media&name={quote(path, safe='')}",
            "headers": {"Content-Type": content_type},
            "path": path,
            "emulated": True,
        }
    blob = _bucket().blob(path)
    url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=expires_minutes),
        method="PUT",
        content_type=content_type,
    )
    return {"method": "PUT", "url": url, "headers": {"Content-Type": content_type}, "path": path}


def generate_signed_download_url(*, path: str, expires_minutes: int = 15) -> str:
    if _is_emulated():
        host = os.environ["FIREBASE_STORAGE_EMULATOR_HOST"]
        bucket = settings.FIREBASE_STORAGE_BUCKET or "rpa-irms-dev.appspot.com"
        return f"http://{host}/v0/b/{bucket}/o/{quote(path, safe='')}?alt=media"
    blob = _bucket().blob(path)
    return blob.generate_signed_url(
        version="v4", expiration=timedelta(minutes=expires_minutes), method="GET"
    )


def upload_bytes(*, path: str, data: bytes, content_type: str) -> None:
    if _is_emulated():
        return  # Tests skip real upload; the bytes are kept in caller memory.
    blob = _bucket().blob(path)
    blob.upload_from_string(data, content_type=content_type)
