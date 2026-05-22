"""Role-based DRF permission classes.

The role string is loaded from Firestore on every request by
`FirebaseAuthentication` and attached to `request.user.role`.
"""
from __future__ import annotations

from rest_framework.permissions import BasePermission

ROLE_APPLICANT = "applicant"
ROLE_NRSO_LIC = "nrso_lic"
ROLE_SNRSO_LIC = "snrso_lic"
ROLE_NRSO_INSP = "nrso_insp"
ROLE_SNRSO_INSP = "snrso_insp"
ROLE_MNRS = "mnrs"
ROLE_DNRS = "dnrs"
ROLE_TECHCOM = "techcom"
ROLE_ED = "ed"
ROLE_BOARD_CHAIR = "board_chair"
ROLE_ACCOUNTS = "accounts"
ROLE_ADMIN = "admin"

ALL_STAFF_ROLES = {
    ROLE_NRSO_LIC, ROLE_SNRSO_LIC, ROLE_NRSO_INSP, ROLE_SNRSO_INSP,
    ROLE_MNRS, ROLE_DNRS, ROLE_TECHCOM, ROLE_ED, ROLE_BOARD_CHAIR,
    ROLE_ACCOUNTS, ROLE_ADMIN,
}
LICENSING_REVIEW_ROLES = {ROLE_NRSO_LIC, ROLE_SNRSO_LIC, ROLE_MNRS, ROLE_DNRS, ROLE_ED}


class HasRole(BasePermission):
    """Subclass and set `allowed_roles` to a frozenset of role keys."""

    allowed_roles: frozenset[str] = frozenset()

    def has_permission(self, request, _view) -> bool:
        user = getattr(request, "user", None)
        return bool(user and getattr(user, "role", None) in self.allowed_roles)


class IsApplicant(HasRole):
    allowed_roles = frozenset({ROLE_APPLICANT})


class IsAccounts(HasRole):
    allowed_roles = frozenset({ROLE_ACCOUNTS, ROLE_ADMIN})


class IsStaff(HasRole):
    allowed_roles = frozenset(ALL_STAFF_ROLES)


class IsAdmin(HasRole):
    allowed_roles = frozenset({ROLE_ADMIN})


class IsLicensingReviewer(HasRole):
    allowed_roles = frozenset(LICENSING_REVIEW_ROLES | {ROLE_ADMIN})


class IsED(HasRole):
    allowed_roles = frozenset({ROLE_ED, ROLE_ADMIN})


class IsApplicantOrStaff(BasePermission):
    """Either the resource owner (applicant) or any staff member."""

    def has_permission(self, request, _view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return user.role == ROLE_APPLICANT or user.role in ALL_STAFF_ROLES
