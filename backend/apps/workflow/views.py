from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import StageConfigSerializer
from .states import STAGES


class WorkflowConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        out = []
        for stage in STAGES.values():
            out.append({
                "key": stage.key,
                "label": stage.label,
                "approver_roles": sorted(stage.approver_roles),
                "next_stage": stage.next_stage,
                "can_request_info": stage.can_request_info,
                "can_reject": stage.can_reject,
            })
        return Response({"results": StageConfigSerializer(out, many=True).data})
