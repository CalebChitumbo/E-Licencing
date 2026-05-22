from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import audit
from irms import repository as repo
from irms.exceptions import NotFound
from irms.permissions import IsAdmin

from .serializers import ProfileUpdateSerializer, RoleAssignmentSerializer, UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_doc = repo.doc("users", request.user.uid)
        if not user_doc:
            raise NotFound("user profile not found")
        return Response(UserSerializer(user_doc).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        repo.update_doc("users", request.user.uid, serializer.validated_data)
        return Response(UserSerializer(repo.doc("users", request.user.uid)).data)


class AuthExchangeView(APIView):
    """Client calls this immediately after Firebase sign-in to load the
    server-side profile (and to trigger first-time user creation)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        repo.update_doc("users", request.user.uid, {"last_login_at": repo.now()})
        user_doc = repo.doc("users", request.user.uid) or {}
        return Response(UserSerializer(user_doc).data, status=status.HTTP_200_OK)


class UserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        role = request.query_params.get("role")
        where = [("role", "==", role)] if role else None
        users = repo.list_docs("users", where=where, order_by="email")
        return Response({"results": [UserSerializer(u).data for u in users]})


class UserRoleView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, uid: str):
        serializer = RoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = repo.doc("users", uid)
        if not target:
            raise NotFound("user not found")
        new_role = serializer.validated_data["role"]
        old_role = target.get("role")
        repo.update_doc("users", uid, {"role": new_role})
        audit(
            actor=request.user,
            action="user.role.changed",
            target_collection="users",
            target_id=uid,
            details={"from": old_role, "to": new_role},
        )
        return Response(UserSerializer(repo.doc("users", uid)).data)


class UserActivationView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, uid: str):
        is_active = bool(request.data.get("is_active", True))
        target = repo.doc("users", uid)
        if not target:
            raise NotFound("user not found")
        repo.update_doc("users", uid, {"is_active": is_active})
        audit(
            actor=request.user,
            action="user.activation.changed",
            target_collection="users",
            target_id=uid,
            details={"is_active": is_active},
        )
        return Response(UserSerializer(repo.doc("users", uid)).data)
