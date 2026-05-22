from rest_framework import serializers

from irms.permissions import ALL_STAFF_ROLES, ROLE_APPLICANT

VALID_ROLES = {ROLE_APPLICANT, *ALL_STAFF_ROLES}


class UserSerializer(serializers.Serializer):
    uid = serializers.CharField(read_only=True)
    email = serializers.EmailField()
    display_name = serializers.CharField(allow_blank=True, required=False)
    phone = serializers.CharField(allow_blank=True, required=False)
    role = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    mfa_enabled = serializers.BooleanField(read_only=True)


class ProfileUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(allow_blank=True, required=False, max_length=120)
    phone = serializers.CharField(allow_blank=True, required=False, max_length=32)


class RoleAssignmentSerializer(serializers.Serializer):
    role = serializers.CharField()

    def validate_role(self, value: str) -> str:
        if value not in VALID_ROLES:
            raise serializers.ValidationError(f"unknown role: {value}")
        return value
