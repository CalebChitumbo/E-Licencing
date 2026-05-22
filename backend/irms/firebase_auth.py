"""Firebase ID-token authentication for DRF.

Verifies the bearer token on every request, loads the matching user document
from Firestore (creating a minimal stub on first sight), and attaches a
`FirebaseUser` to `request.user` along with the cached role.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from firebase_admin import auth as fb_auth
from rest_framework import authentication, exceptions

from .firestore import get_client, server_timestamp


@dataclass
class FirebaseUser:
    uid: str
    email: str
    role: str
    display_name: str = ""
    is_active: bool = True

    # DRF expects these.
    is_authenticated: bool = True
    is_anonymous: bool = False
    is_staff: bool = False

    @property
    def pk(self) -> str:
        return self.uid

    @property
    def id(self) -> str:
        return self.uid

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"


class FirebaseAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request) -> tuple[FirebaseUser, str] | None:
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith(f"{self.keyword} "):
            return None
        token = header[len(self.keyword) + 1 :].strip()
        if not token:
            return None
        try:
            decoded = fb_auth.verify_id_token(token, check_revoked=False)
        except (fb_auth.InvalidIdTokenError, fb_auth.ExpiredIdTokenError, ValueError) as exc:
            raise exceptions.AuthenticationFailed(f"invalid id token: {exc}") from exc

        uid = decoded["uid"]
        email = decoded.get("email", "")
        user_doc = self._load_or_create_user(uid, email, decoded)
        if not user_doc.get("is_active", True):
            raise exceptions.AuthenticationFailed("account disabled")
        return (
            FirebaseUser(
                uid=uid,
                email=user_doc.get("email", email),
                role=user_doc.get("role", "applicant"),
                display_name=user_doc.get("display_name", ""),
                is_active=user_doc.get("is_active", True),
            ),
            token,
        )

    def authenticate_header(self, _request) -> str:
        return self.keyword

    def _load_or_create_user(self, uid: str, email: str, decoded: dict[str, Any]) -> dict[str, Any]:
        ref = get_client().collection("users").document(uid)
        snap = ref.get()
        if snap.exists:
            data = snap.to_dict() or {}
            return data
        new_user = {
            "uid": uid,
            "email": email,
            "display_name": decoded.get("name", "") or email.split("@")[0],
            "phone": decoded.get("phone_number", ""),
            "role": "applicant",
            "is_active": True,
            "mfa_enabled": False,
            "created_at": server_timestamp(),
            "last_login_at": server_timestamp(),
        }
        ref.set(new_user)
        return new_user
