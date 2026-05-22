from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import audit
from irms import repository as repo
from irms.exceptions import NotFound
from irms.permissions import ROLE_APPLICANT, IsApplicantOrStaff, IsStaff

from .serializers import FacilitySerializer, SourceSerializer


def _can_access(user, facility: dict) -> bool:
    return user.role != ROLE_APPLICANT or facility.get("owner_uid") == user.uid


class FacilityListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request):
        if request.user.role == ROLE_APPLICANT:
            where = [("owner_uid", "==", request.user.uid)]
        else:
            owner = request.query_params.get("owner_uid")
            where = [("owner_uid", "==", owner)] if owner else None
        facilities = repo.list_docs(
            "facilities", where=where, order_by="updated_at", descending=True
        )
        return Response({"results": [FacilitySerializer(f).data for f in facilities]})

    def post(self, request):
        serializer = FacilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = {**serializer.validated_data, "owner_uid": request.user.uid}
        facility_id = repo.create_doc("facilities", payload)
        audit(
            actor=request.user,
            action="facility.created",
            target_collection="facilities",
            target_id=facility_id,
        )
        return Response(
            FacilitySerializer(repo.doc("facilities", facility_id)).data,
            status=status.HTTP_201_CREATED,
        )


class FacilityDetailView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, facility_id: str):
        facility = repo.doc("facilities", facility_id)
        if not facility or not _can_access(request.user, facility):
            raise NotFound("facility not found")
        return Response(FacilitySerializer(facility).data)

    def patch(self, request, facility_id: str):
        facility = repo.doc("facilities", facility_id)
        if not facility or not _can_access(request.user, facility):
            raise NotFound("facility not found")
        serializer = FacilitySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        repo.update_doc("facilities", facility_id, serializer.validated_data)
        audit(
            actor=request.user,
            action="facility.updated",
            target_collection="facilities",
            target_id=facility_id,
        )
        return Response(FacilitySerializer(repo.doc("facilities", facility_id)).data)

    def delete(self, request, facility_id: str):
        facility = repo.doc("facilities", facility_id)
        if not facility or not _can_access(request.user, facility):
            raise NotFound("facility not found")
        repo.delete_doc("facilities", facility_id)
        audit(
            actor=request.user,
            action="facility.deleted",
            target_collection="facilities",
            target_id=facility_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SourceListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, facility_id: str):
        facility = repo.doc("facilities", facility_id)
        if not facility or not _can_access(request.user, facility):
            raise NotFound("facility not found")
        sources = repo.subcollection_list("facilities", facility_id, "sources", order_by="created_at")
        return Response({"results": [SourceSerializer(s).data for s in sources]})

    def post(self, request, facility_id: str):
        facility = repo.doc("facilities", facility_id)
        if not facility or not _can_access(request.user, facility):
            raise NotFound("facility not found")
        serializer = SourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source_id = repo.subcollection_add(
            "facilities", facility_id, "sources", serializer.validated_data
        )
        audit(
            actor=request.user,
            action="source.created",
            target_collection="facilities",
            target_id=facility_id,
            details={"source_id": source_id},
        )
        return Response({"id": source_id, **serializer.validated_data}, status=status.HTTP_201_CREATED)


class StaffFacilitySearchView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        results = repo.list_docs("facilities", order_by="name", limit=100)
        if q:
            ql = q.lower()
            results = [
                f for f in results
                if ql in f.get("name", "").lower() or ql in f.get("pacra_number", "").lower()
            ]
        return Response({"results": [FacilitySerializer(f).data for f in results]})
