from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.licences.serializers import PublicLicenceSerializer
from apps.licences.services import public_view


class PublicVerifyThrottle(AnonRateThrottle):
    scope = "public_verify"


class PublicLicenceVerifyView(APIView):
    """Anonymous endpoint — returns a minimal projection of the licence."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [PublicVerifyThrottle]

    def get(self, _request, licence_number: str):
        return Response(PublicLicenceSerializer(public_view(licence_number)).data)
