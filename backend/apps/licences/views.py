from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from irms import repository as repo
from irms.exceptions import NotFound
from irms.permissions import IsAdmin, IsED

from . import services
from .serializers import LicenceSerializer, RevokeSerializer


class LicenceGenerateView(APIView):
    permission_classes = [IsAuthenticated, IsED]

    def post(self, request, app_id: str):
        licence = services.generate_licence_for_application(app_id=app_id, actor=request.user)
        return Response(LicenceSerializer(licence).data)


class LicenceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request, licence_number: str):
        licence = repo.doc("licences", licence_number)
        if not licence:
            raise NotFound("licence not found")
        return Response(LicenceSerializer(licence).data)


class LicenceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request, licence_number: str):
        return Response({"url": services.licence_download_url(licence_number)})


class LicenceRevokeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, licence_number: str):
        serializer = RevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        licence = services.revoke_licence(
            licence_number, actor=request.user, reason=serializer.validated_data["reason"],
        )
        return Response(LicenceSerializer(licence).data)
