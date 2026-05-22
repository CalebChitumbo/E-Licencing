"""Pytest fixtures shared across all backend tests."""
from __future__ import annotations

import os
from typing import Any

import pytest


@pytest.fixture(autouse=True)
def _isolate_firestore(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force every test to use an in-process mock Firestore client."""
    from mockfirestore import MockFirestore

    from irms import firestore as fs_module

    client = MockFirestore()
    monkeypatch.setattr(fs_module, "_client", client)
    monkeypatch.setattr(fs_module, "get_client", lambda: client)


@pytest.fixture
def firestore() -> Any:
    from irms.firestore import get_client

    return get_client()


@pytest.fixture
def user_factory(firestore: Any):
    """Create a Firestore-backed user document with the given role."""

    def _make(uid: str = "test-uid", role: str = "applicant", **extra: Any) -> dict[str, Any]:
        data = {
            "uid": uid,
            "email": f"{uid}@example.com",
            "display_name": uid.title(),
            "role": role,
            "is_active": True,
            **extra,
        }
        firestore.collection("users").document(uid).set(data)
        return data

    return _make


@pytest.fixture
def authed_client(user_factory):
    """Return a DRF APIClient with a fake-authenticated request user."""
    from rest_framework.test import APIClient

    from irms.firebase_auth import FirebaseUser

    def _build(role: str = "applicant", uid: str = "test-uid"):
        user_factory(uid=uid, role=role)
        client = APIClient()
        client.force_authenticate(user=FirebaseUser(uid=uid, email=f"{uid}@example.com", role=role))
        return client

    return _build


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "irms.settings.dev")
