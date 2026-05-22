from __future__ import annotations

import pytest


@pytest.mark.django_db
def test_me_returns_profile(authed_client):
    client = authed_client(role="applicant", uid="user-1")
    resp = client.get("/api/v1/me")
    assert resp.status_code == 200
    assert resp.data["uid"] == "user-1"
    assert resp.data["role"] == "applicant"


@pytest.mark.django_db
def test_me_patch_updates_profile(authed_client):
    client = authed_client(role="applicant", uid="user-2")
    resp = client.patch("/api/v1/me", {"display_name": "Alice"}, format="json")
    assert resp.status_code == 200
    assert resp.data["display_name"] == "Alice"


@pytest.mark.django_db
def test_role_assignment_requires_admin(authed_client, firestore):
    firestore.collection("users").document("target").set({
        "uid": "target", "email": "t@example.com", "role": "applicant", "is_active": True,
    })
    applicant = authed_client(role="applicant", uid="not-admin")
    assert applicant.post("/api/v1/admin/users/target/role", {"role": "nrso_lic"}, format="json").status_code == 403

    admin = authed_client(role="admin", uid="admin-1")
    resp = admin.post("/api/v1/admin/users/target/role", {"role": "nrso_lic"}, format="json")
    assert resp.status_code == 200
    assert resp.data["role"] == "nrso_lic"


@pytest.mark.django_db
def test_role_assignment_rejects_unknown_role(authed_client, firestore):
    firestore.collection("users").document("target").set({
        "uid": "target", "email": "t@example.com", "role": "applicant", "is_active": True,
    })
    admin = authed_client(role="admin", uid="admin-2")
    resp = admin.post("/api/v1/admin/users/target/role", {"role": "bogus"}, format="json")
    assert resp.status_code == 400
