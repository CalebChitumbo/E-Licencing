from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"results": services.list_for_user(request.user.uid)})


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notif_id: str):
        services.mark_read(request.user.uid, notif_id)
        return Response({"status": "ok"})
