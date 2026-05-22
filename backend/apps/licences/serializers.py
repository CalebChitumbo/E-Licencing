from rest_framework import serializers


class LicenceSerializer(serializers.Serializer):
    licence_number = serializers.CharField(read_only=True)
    application_id = serializers.CharField(read_only=True)
    holder_uid = serializers.CharField(read_only=True)
    holder_name = serializers.CharField()
    facility_snapshot = serializers.DictField()
    issued_at = serializers.CharField()
    expires_at = serializers.CharField()
    conditions = serializers.ListField(child=serializers.CharField())
    status = serializers.CharField()
    pdf_storage_path = serializers.CharField(allow_blank=True, required=False)
    digital_signature_info = serializers.DictField()


class PublicLicenceSerializer(serializers.Serializer):
    licence_number = serializers.CharField()
    holder_name = serializers.CharField(allow_blank=True)
    facility_name = serializers.CharField(allow_blank=True)
    facility_district = serializers.CharField(allow_blank=True)
    facility_province = serializers.CharField(allow_blank=True)
    issued_at = serializers.CharField()
    expires_at = serializers.CharField()
    status = serializers.CharField()
    verify_url = serializers.CharField()


class RevokeSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)
