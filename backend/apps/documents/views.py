from __future__ import annotations

import uuid

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import audit_for_application
from irms import repository as repo
from irms.exceptions import NotFound
from irms.firestore import get_client
from irms.permissions import ALL_STAFF_ROLES, IsApplicantOrStaff

from . import storage
from .serializers import DocumentSerializer, UploadIntentSerializer


def _can_view_app(user, app: dict) -> bool:
    return user.role in ALL_STAFF_ROLES or app.get("applicant_uid") == user.uid


class DocumentUploadIntentView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def post(self, request, app_id: str):
        app = repo.doc("applications", app_id)
        if not app or not _can_view_app(request.user, app):
            raise NotFound("application not found")

        intent = UploadIntentSerializer(data=request.data)
        intent.is_valid(raise_exception=True)
        doc_id = uuid.uuid4().hex
        storage_path = f"applications/{app_id}/documents/{doc_id}-{intent.validated_data['filename']}"
        signed = storage.generate_signed_upload_url(
            path=storage_path, content_type=intent.validated_data["content_type"],
        )
        repo.subcollection_add(
            "applications", app_id, "documents",
            {
                "id": doc_id,
                "name": intent.validated_data["filename"],
                "category": intent.validated_data["category"],
                "storage_path": storage_path,
                "mime": intent.validated_data["content_type"],
                "size_bytes": intent.validated_data["size_bytes"],
                "uploaded_by": request.user.uid,
                "uploaded_at": repo.now(),
                "version": 1,
            },
            doc_id=doc_id,
        )
        audit_for_application(
            application_id=app_id, actor=request.user, action="document.uploaded",
            details={"document_id": doc_id, "name": intent.validated_data["filename"]},
        )
        return Response(signed, status=status.HTTP_201_CREATED)


class DocumentListView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, app_id: str):
        app = repo.doc("applications", app_id)
        if not app or not _can_view_app(request.user, app):
            raise NotFound("application not found")
        docs = repo.subcollection_list(
            "applications", app_id, "documents", order_by="uploaded_at", descending=True,
        )
        return Response({"results": [DocumentSerializer(d).data for d in docs]})


class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, app_id: str, doc_id: str):
        app = repo.doc("applications", app_id)
        if not app or not _can_view_app(request.user, app):
            raise NotFound("application not found")
        snap = (
            get_client()
            .collection("applications").document(app_id)
            .collection("documents").document(doc_id)
            .get()
        )
        if not snap.exists:
            raise NotFound("document not found")
        path = (snap.to_dict() or {}).get("storage_path", "")
        return Response({"url": storage.generate_signed_download_url(path=path)})
