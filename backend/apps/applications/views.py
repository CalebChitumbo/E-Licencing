from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.licences.services import generate_licence_for_application
from apps.payments.services import create_invoice_for_application
from apps.workflow import services as workflow
from apps.workflow.serializers import TransitionSerializer
from apps.workflow.states import ED_APPROVAL
from irms import repository as repo
from irms.exceptions import NotFound, WorkflowError
from irms.permissions import (
    ALL_STAFF_ROLES,
    ROLE_APPLICANT,
    IsApplicantOrStaff,
    IsStaff,
)

from . import services
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationSerializer,
    WizardStepSerializer,
)


def _can_view(user, app: dict) -> bool:
    if user.role in ALL_STAFF_ROLES:
        return True
    return app.get("applicant_uid") == user.uid


class ApplicationListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request):
        if request.user.role == ROLE_APPLICANT:
            results = services.list_for_applicant(request.user.uid)
        else:
            stage = request.query_params.get("stage")
            mine = request.query_params.get("mine") == "1"
            results = services.list_for_staff(
                role=request.user.role,
                stage=stage,
                assigned_to_uid=request.user.uid if mine else None,
            )
        return Response({"results": [ApplicationSerializer(a).data for a in results]})

    def post(self, request):
        serializer = ApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if request.user.role != ROLE_APPLICANT:
            raise WorkflowError("only applicants may create applications")
        app = services.create_application(
            actor=request.user, **serializer.validated_data,
        )
        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, app_id: str):
        app = repo.doc("applications", app_id)
        if not app or not _can_view(request.user, app):
            raise NotFound("application not found")
        return Response(ApplicationSerializer(app).data)


class ApplicationWizardView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def patch(self, request, app_id: str):
        serializer = WizardStepSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        app = services.update_wizard(
            actor=request.user,
            app_id=app_id,
            step=serializer.validated_data["step"],
            data=serializer.validated_data["data"],
        )
        return Response(ApplicationSerializer(app).data)


class ApplicationSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def post(self, request, app_id: str):
        app = workflow.submit(app_id, request.user)
        invoice = create_invoice_for_application(app, actor=request.user)
        return Response(
            {**ApplicationSerializer(app).data, "invoice_id": invoice["id"]},
            status=status.HTTP_200_OK,
        )


class ApplicationTransitionView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    def post(self, request, app_id: str):
        serializer = TransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        current = repo.doc("applications", app_id) or {}

        # ED approval is the terminal approval: instead of advancing the
        # stage, we generate the licence (which in turn advances the stage).
        if action == "approve" and current.get("current_stage") == ED_APPROVAL:
            generate_licence_for_application(app_id=app_id, actor=request.user)
            return Response(ApplicationSerializer(repo.doc("applications", app_id)).data)

        app = workflow.transition(
            app_id, request.user,
            action=action,
            reason=serializer.validated_data.get("reason", ""),
            assignee_uid=serializer.validated_data.get("assignee_uid") or None,
        )
        return Response(ApplicationSerializer(app).data)


class ApplicationAuditView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, app_id: str):
        app = repo.doc("applications", app_id)
        if not app or not _can_view(request.user, app):
            raise NotFound("application not found")
        return Response({"results": services.get_audit_trail(app_id)})


class StaffQueueView(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    def get(self, request):
        mine = request.query_params.get("mine") == "1"
        results = services.list_for_staff(
            role=request.user.role,
            assigned_to_uid=request.user.uid if mine else None,
        )
        return Response({"results": [ApplicationSerializer(a).data for a in results]})
