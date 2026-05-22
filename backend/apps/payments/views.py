from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from irms import repository as repo
from irms.exceptions import NotFound
from irms.permissions import ROLE_APPLICANT, IsAccounts, IsAdmin, IsApplicantOrStaff

from . import services
from .fees import get_schedule, set_schedule
from .serializers import (
    FeeScheduleSerializer,
    InvoiceSerializer,
    UploadProofSerializer,
    VerifyPaymentSerializer,
)


class InvoiceListView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request):
        if request.user.role == ROLE_APPLICANT:
            invoices = repo.list_docs("invoices", where=[("applicant_uid", "==", request.user.uid)],
                                      order_by="created_at", descending=True)
        else:
            status_filter = request.query_params.get("status") or "pending"
            invoices = repo.list_docs("invoices", where=[("status", "==", status_filter)],
                                      order_by="created_at", descending=True)
        return Response({"results": [InvoiceSerializer(i).data for i in invoices]})


class InvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def get(self, request, invoice_id: str):
        invoice = repo.doc("invoices", invoice_id)
        if not invoice:
            raise NotFound("invoice not found")
        if request.user.role == ROLE_APPLICANT and invoice.get("applicant_uid") != request.user.uid:
            raise NotFound("invoice not found")
        return Response(InvoiceSerializer(invoice).data)


class InvoiceProofView(APIView):
    permission_classes = [IsAuthenticated, IsApplicantOrStaff]

    def post(self, request, invoice_id: str):
        serializer = UploadProofSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = services.attach_proof(
            invoice_id, serializer.validated_data["storage_path"], actor=request.user,
        )
        return Response(InvoiceSerializer(invoice).data)


class InvoiceVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAccounts]

    def post(self, request, invoice_id: str):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = services.verify_invoice(
            invoice_id, actor=request.user, **serializer.validated_data,
        )
        return Response(InvoiceSerializer(invoice).data)


class FeeScheduleView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, _request):
        return Response(FeeScheduleSerializer({"fees": get_schedule(), "currency": "ZMW"}).data)

    def put(self, request):
        serializer = FeeScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        set_schedule(serializer.validated_data["fees"])
        return Response(FeeScheduleSerializer({"fees": get_schedule(), "currency": "ZMW"}).data)
