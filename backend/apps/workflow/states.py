"""Application workflow state machine.

The MVP routes a Form-I licence application through:
  draft → submitted → nrso_review → snrso_review → mnrs_review
        → dnrs_review → ed_approval → licence_generated

`submitted` is shorthand for "awaiting payment verification" — the only
party allowed to advance an application out of `submitted` is the accounts
role (via the invoice-verify endpoint, which transitions straight to
`nrso_review`).

At every review stage the reviewer may also `request_info` (returns to the
applicant via the `info_requested` virtual stage) or `reject` (terminal).
"""
from __future__ import annotations

from dataclasses import dataclass

from irms.permissions import (
    ROLE_ACCOUNTS,
    ROLE_ADMIN,
    ROLE_DNRS,
    ROLE_ED,
    ROLE_MNRS,
    ROLE_NRSO_LIC,
    ROLE_SNRSO_LIC,
)

# Stage keys
DRAFT = "draft"
SUBMITTED = "submitted"
NRSO_REVIEW = "nrso_review"
SNRSO_REVIEW = "snrso_review"
MNRS_REVIEW = "mnrs_review"
DNRS_REVIEW = "dnrs_review"
ED_APPROVAL = "ed_approval"
LICENCE_GENERATED = "licence_generated"
INFO_REQUESTED = "info_requested"
REJECTED = "rejected"

STATUS_FOR_STAGE = {
    DRAFT: "draft",
    SUBMITTED: "payment_pending",
    NRSO_REVIEW: "under_review",
    SNRSO_REVIEW: "under_review",
    MNRS_REVIEW: "under_review",
    DNRS_REVIEW: "under_review",
    ED_APPROVAL: "under_review",
    LICENCE_GENERATED: "licence_generated",
    INFO_REQUESTED: "info_requested",
    REJECTED: "rejected",
}


@dataclass(frozen=True)
class Stage:
    key: str
    label: str
    approver_roles: frozenset[str]
    next_stage: str | None
    can_request_info: bool = True
    can_reject: bool = True


STAGES: dict[str, Stage] = {
    DRAFT: Stage(DRAFT, "Draft", frozenset(), SUBMITTED,
                 can_request_info=False, can_reject=False),
    SUBMITTED: Stage(SUBMITTED, "Awaiting Payment Verification",
                     frozenset({ROLE_ACCOUNTS, ROLE_ADMIN}), NRSO_REVIEW,
                     can_request_info=False, can_reject=True),
    NRSO_REVIEW: Stage(NRSO_REVIEW, "NRSO Licensing Review",
                       frozenset({ROLE_NRSO_LIC, ROLE_ADMIN}), SNRSO_REVIEW),
    SNRSO_REVIEW: Stage(SNRSO_REVIEW, "Senior NRSO Review",
                        frozenset({ROLE_SNRSO_LIC, ROLE_ADMIN}), MNRS_REVIEW),
    MNRS_REVIEW: Stage(MNRS_REVIEW, "Manager Nuclear & Radiation Safety",
                       frozenset({ROLE_MNRS, ROLE_ADMIN}), DNRS_REVIEW),
    DNRS_REVIEW: Stage(DNRS_REVIEW, "Director Nuclear & Radiation Safety",
                       frozenset({ROLE_DNRS, ROLE_ADMIN}), ED_APPROVAL),
    ED_APPROVAL: Stage(ED_APPROVAL, "Executive Director Approval",
                       frozenset({ROLE_ED, ROLE_ADMIN}), LICENCE_GENERATED),
    LICENCE_GENERATED: Stage(LICENCE_GENERATED, "Licence Generated", frozenset(), None,
                             can_request_info=False, can_reject=False),
    INFO_REQUESTED: Stage(INFO_REQUESTED, "Information Requested", frozenset(), None,
                          can_request_info=False, can_reject=False),
    REJECTED: Stage(REJECTED, "Rejected", frozenset(), None,
                    can_request_info=False, can_reject=False),
}


def is_terminal(stage: str) -> bool:
    return stage in {LICENCE_GENERATED, REJECTED}


def stage_for(role: str) -> list[str]:
    return [s.key for s in STAGES.values() if role in s.approver_roles]
