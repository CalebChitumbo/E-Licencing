"""Firestore client bootstrap.

The Admin SDK bypasses Firestore security rules; every server-side read or
write goes through this client.
"""
from __future__ import annotations

import os
from typing import Any

import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore

_app: firebase_admin.App | None = None
_client: Any | None = None


def _init_firebase_app() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app
    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    if os.environ.get("FIRESTORE_EMULATOR_HOST") or os.environ.get("FIREBASE_AUTH_EMULATOR_HOST"):
        # Emulator mode — no credentials required.
        _app = firebase_admin.initialize_app(options={"projectId": project_id or "rpa-irms-dev"})
    else:
        cred = credentials.ApplicationDefault()
        _app = firebase_admin.initialize_app(cred, {"projectId": project_id})
    return _app


def get_client() -> Any:
    global _client
    if _client is not None:
        return _client
    _init_firebase_app()
    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get(
        "GOOGLE_CLOUD_PROJECT", "rpa-irms-dev"
    )
    _client = firestore.Client(project=project_id)
    return _client


def server_timestamp() -> Any:
    return firestore.SERVER_TIMESTAMP


def transaction() -> Any:
    return get_client().transaction()


def array_union(*items: Any) -> Any:
    return firestore.ArrayUnion(list(items))


def increment(amount: int = 1) -> Any:
    return firestore.Increment(amount)
