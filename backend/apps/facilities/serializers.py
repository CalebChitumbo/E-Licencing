from rest_framework import serializers

FACILITY_TYPES = [
    "medical", "industrial", "research", "educational", "veterinary", "transport", "other",
]
SOURCE_TYPES = [
    "xray_machine", "sealed_source", "unsealed_source",
    "linear_accelerator", "ct_scanner", "fluoroscopy",
    "mammography", "dental_xray", "veterinary_xray",
    "industrial_radiography", "well_logging", "gauges", "other",
]
SOURCE_STATUSES = ["active", "stored", "disposed", "transferred"]


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, allow_blank=True, required=False)
    nrc = serializers.CharField(max_length=32, allow_blank=True, required=False)
    phone = serializers.CharField(max_length=32, allow_blank=True, required=False)
    email = serializers.EmailField(allow_blank=True, required=False)


class GPSSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()


class RPOSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    qualifications = serializers.CharField(allow_blank=True, required=False)
    phone = serializers.CharField(max_length=32)
    email = serializers.EmailField(allow_blank=True, required=False)


class FacilitySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    owner_uid = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=200)
    type = serializers.ChoiceField(choices=FACILITY_TYPES)
    legal_rep = ContactSerializer()
    pacra_number = serializers.CharField(max_length=64, allow_blank=True, required=False)
    gov_entity = serializers.BooleanField(default=False)
    rpo = RPOSerializer(required=False, allow_null=True)
    address = serializers.CharField(allow_blank=True, required=False)
    province = serializers.CharField(max_length=64, allow_blank=True, required=False)
    district = serializers.CharField(max_length=64, allow_blank=True, required=False)
    gps = GPSSerializer(required=False, allow_null=True)
    notification_contacts = ContactSerializer(many=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class SourceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    type = serializers.ChoiceField(choices=SOURCE_TYPES)
    make = serializers.CharField(max_length=120, allow_blank=True, required=False)
    model = serializers.CharField(max_length=120, allow_blank=True, required=False)
    serial = serializers.CharField(max_length=120, allow_blank=True, required=False)
    activity_bq = serializers.FloatField(required=False, allow_null=True)
    nuclide = serializers.CharField(max_length=32, allow_blank=True, required=False)
    half_life_days = serializers.FloatField(required=False, allow_null=True)
    gps = GPSSerializer(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=SOURCE_STATUSES, default="active")
    commissioned_on = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(allow_blank=True, required=False)
