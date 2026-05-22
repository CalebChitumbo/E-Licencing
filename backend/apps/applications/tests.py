import pytest

from apps.workflow import services as wf


def _make_facility(firestore, owner="alice"):
    fid = "fac-1"
    firestore.collection("facilities").document(fid).set({
        "owner_uid": owner, "name": "Apex", "type": "medical",
        "rpo": {"name": "Dr Mwanza", "phone": "+260977000000"},
    })
    return fid


@pytest.mark.django_db
def test_applicant_creates_application(authed_client, firestore):
    facility_id = _make_facility(firestore, owner="alice")
    client = authed_client(role="applicant", uid="alice")
    resp = client.post(
        "/api/v1/applications",
        {"form_type": "FORM_I", "facility_id": facility_id},
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["current_stage"] == "draft"


@pytest.mark.django_db
def test_disabled_form_type_is_rejected(authed_client, firestore):
    facility_id = _make_facility(firestore, owner="alice")
    client = authed_client(role="applicant", uid="alice")
    resp = client.post(
        "/api/v1/applications",
        {"form_type": "FORM_V", "facility_id": facility_id},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_full_happy_path_to_licence_generated(authed_client, firestore):
    fid = _make_facility(firestore, owner="alice")
    applicant = authed_client(role="applicant", uid="alice")
    create = applicant.post(
        "/api/v1/applications",
        {"form_type": "FORM_I", "facility_id": fid},
        format="json",
    )
    app_id = create.data["id"]
    applicant.patch(
        f"/api/v1/applications/{app_id}/wizard",
        {"step": 1, "data": {"applicant_name": "Alice"}},
        format="json",
    )
    submit = applicant.post(f"/api/v1/applications/{app_id}/submit")
    assert submit.status_code == 200
    assert submit.data["current_stage"] == "submitted"
    invoice_id = submit.data["invoice_id"]
    assert invoice_id

    # Accounts verifies the payment (which transitions to payment_verified and
    # then immediately to nrso_review through the explicit verify endpoint).
    accounts = authed_client(role="accounts", uid="acct-1")
    accounts.post(
        f"/api/v1/invoices/{invoice_id}/verify",
        {"payment_ref": "MMREF-1"},
        format="json",
    )

    # Walk through every approval stage.
    for role, uid in [
        ("nrso_lic", "n1"),
        ("snrso_lic", "s1"),
        ("mnrs", "m1"),
        ("dnrs", "d1"),
        ("ed", "e1"),
    ]:
        client = authed_client(role=role, uid=uid)
        resp = client.post(
            f"/api/v1/applications/{app_id}/transition",
            {"action": "approve"},
            format="json",
        )
        assert resp.status_code == 200, (role, resp.data)

    # After ED approves, the application moves to LICENCE_GENERATED.
    app = wf.get_application(app_id)
    assert app["current_stage"] == "licence_generated"


@pytest.mark.django_db
def test_wrong_role_cannot_advance_stage(authed_client, firestore):
    fid = _make_facility(firestore, owner="alice")
    applicant = authed_client(role="applicant", uid="alice")
    create = applicant.post(
        "/api/v1/applications",
        {"form_type": "FORM_I", "facility_id": fid},
        format="json",
    )
    app_id = create.data["id"]
    applicant.post(f"/api/v1/applications/{app_id}/submit")

    # An NRSO licensing reviewer cannot act on a submitted application — only
    # the accounts role is at this stage.
    nrso = authed_client(role="nrso_lic", uid="n1")
    resp = nrso.post(
        f"/api/v1/applications/{app_id}/transition",
        {"action": "approve"},
        format="json",
    )
    assert resp.status_code == 400
