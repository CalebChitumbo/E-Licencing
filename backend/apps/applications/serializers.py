from rest_framework import serializers

from .forms import FORM_TYPES


class ApplicationCreateSerializer(serializers.Serializer):
    form_type = serializers.ChoiceField(choices=list(FORM_TYPES.keys()))
    facility_id = serializers.CharField()


class WizardStepSerializer(serializers.Serializer):
    step = serializers.IntegerField(min_value=1)
    data = serializers.DictField()


class ApplicationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    form_type = serializers.CharField()
    applicant_uid = serializers.CharField()
    facility_id = serializers.CharField()
    facility_snapshot = serializers.DictField(required=False)
    current_stage = serializers.CharField()
    status = serializers.CharField()
    assigned_to_uid = serializers.CharField(allow_blank=True, required=False)
    submitted_at = serializers.DateTimeField(required=False, allow_null=True)
    sla_deadline = serializers.DateTimeField(required=False, allow_null=True)
    wizard_data = serializers.DictField(required=False)
    fee_amount = serializers.FloatField(required=False, allow_null=True)
    invoice_id = serializers.CharField(allow_blank=True, required=False)
    licence_id = serializers.CharField(allow_blank=True, required=False)
    rejected_reason = serializers.CharField(allow_blank=True, required=False)
    info_request = serializers.DictField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class ApplicationListItemSerializer(ApplicationSerializer):
    """Same shape — keeps the import-surface stable if we slim down later."""
