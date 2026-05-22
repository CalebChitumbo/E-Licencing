from rest_framework import serializers

ALLOWED_MIMES = [
    "application/pdf",
    "image/jpeg", "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]


class UploadIntentSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=200)
    content_type = serializers.ChoiceField(choices=ALLOWED_MIMES)
    size_bytes = serializers.IntegerField(min_value=1, max_value=25 * 1024 * 1024)
    category = serializers.CharField(max_length=80)


class DocumentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    category = serializers.CharField()
    storage_path = serializers.CharField()
    mime = serializers.CharField()
    size_bytes = serializers.IntegerField()
    uploaded_by = serializers.CharField()
    uploaded_at = serializers.DateTimeField(read_only=True)
    version = serializers.IntegerField(default=1)
