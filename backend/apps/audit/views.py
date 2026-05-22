from rest_framework.response import Response
from rest_framework.views import APIView

from irms import repository as repo
from irms.permissions import IsAdmin


class AuditLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        actor = request.query_params.get("actor_uid")
        limit = int(request.query_params.get("limit", "100"))
        where = [("actor_uid", "==", actor)] if actor else None
        logs = repo.list_docs(
            "audit_logs",
            where=where,
            order_by="timestamp",
            descending=True,
            limit=limit,
        )
        return Response({"results": logs})
