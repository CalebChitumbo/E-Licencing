import pytest


def _sample_facility():
    return {
        "name": "Apex Imaging Centre",
        "type": "medical",
        "legal_rep": {"name": "Jane Doe", "phone": "+260977000000"},
        "pacra_number": "PACRA-12345",
        "gov_entity": False,
        "rpo": {"name": "Dr. Mwanza", "phone": "+260966111222", "qualifications": "MSc Med Phys"},
        "address": "Plot 12, Cairo Rd, Lusaka",
        "province": "Lusaka",
        "district": "Lusaka",
    }


@pytest.mark.django_db
def test_applicant_can_create_and_list_own_facility(authed_client):
    client = authed_client(role="applicant", uid="owner")
    create = client.post("/api/v1/facilities", _sample_facility(), format="json")
    assert create.status_code == 201
    facility_id = create.data["id"]

    lst = client.get("/api/v1/facilities")
    assert lst.status_code == 200
    assert any(f["id"] == facility_id for f in lst.data["results"])


@pytest.mark.django_db
def test_applicant_cannot_see_other_owners_facility(authed_client):
    a = authed_client(role="applicant", uid="alice")
    a.post("/api/v1/facilities", _sample_facility(), format="json")

    b = authed_client(role="applicant", uid="bob")
    lst = b.get("/api/v1/facilities")
    assert lst.status_code == 200
    assert lst.data["results"] == []


@pytest.mark.django_db
def test_source_can_be_added(authed_client):
    client = authed_client(role="applicant", uid="owner")
    create = client.post("/api/v1/facilities", _sample_facility(), format="json")
    facility_id = create.data["id"]
    src = client.post(
        f"/api/v1/facilities/{facility_id}/sources",
        {"type": "xray_machine", "make": "Siemens", "model": "Ysio", "serial": "X1"},
        format="json",
    )
    assert src.status_code == 201
    lst = client.get(f"/api/v1/facilities/{facility_id}/sources")
    assert len(lst.data["results"]) == 1
