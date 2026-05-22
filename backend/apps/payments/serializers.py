from rest_framework import serializers


class LineItemSerializer(serializers.Serializer):
    description = serializers.CharField()
    amount = serializers.FloatField()
    qty = serializers.IntegerField()


class InvoiceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    application_id = serializers.CharField()
    applicant_uid = serializers.CharField()
    line_items = LineItemSerializer(many=True)
    total = serializers.FloatField()
    currency = serializers.CharField()
    status = serializers.CharField()
    payment_ref = serializers.CharField(allow_blank=True, required=False)
    proof_storage_path = serializers.CharField(allow_blank=True, required=False)
    verified_by = serializers.CharField(allow_blank=True, required=False)
    verified_at = serializers.DateTimeField(read_only=True, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class VerifyPaymentSerializer(serializers.Serializer):
    payment_ref = serializers.CharField(max_length=120)
    notes = serializers.CharField(allow_blank=True, required=False)


class UploadProofSerializer(serializers.Serializer):
    storage_path = serializers.CharField(max_length=400)


class FeeScheduleSerializer(serializers.Serializer):
    fees = serializers.DictField(child=serializers.FloatField())
    currency = serializers.CharField(default="ZMW")
