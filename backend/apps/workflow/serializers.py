from rest_framework import serializers

ACTIONS = ["approve", "reject", "request_info", "assign"]


class TransitionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=ACTIONS)
    reason = serializers.CharField(allow_blank=True, required=False, max_length=2000)
    assignee_uid = serializers.CharField(allow_blank=True, required=False)


class StageConfigSerializer(serializers.Serializer):
    key = serializers.CharField(read_only=True)
    label = serializers.CharField(read_only=True)
    approver_roles = serializers.ListField(child=serializers.CharField(), read_only=True)
    next_stage = serializers.CharField(read_only=True, allow_null=True)
    can_request_info = serializers.BooleanField(read_only=True)
    can_reject = serializers.BooleanField(read_only=True)
