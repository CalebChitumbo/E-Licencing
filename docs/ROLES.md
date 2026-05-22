# Roles

Every Firebase user has exactly one role stored in `users/{uid}.role`. New
self-registrations default to `applicant`; the admin assigns staff roles via
the User Management page (`/admin/users`).

| Key | Label | Phase 1 capabilities |
|---|---|---|
| `applicant` | Applicant | Manage own facilities + sources; create / edit drafts; submit Form I; upload supporting documents; pay invoices; view own application status and audit trail; verify public licences. |
| `nrso_lic` | NRSO (Licensing) | Approve / reject / request-info at the `nrso_review` stage. |
| `snrso_lic` | Senior NRSO (Licensing) | Same actions at `snrso_review`. |
| `mnrs` | Manager — Nuclear & Radiation Safety | Same actions at `mnrs_review`. |
| `dnrs` | Director — Nuclear & Radiation Safety | Same actions at `dnrs_review`. |
| `ed` | Executive Director | Final approval at `ed_approval`; an "approve" here triggers licence generation, digital signing, and PDF upload. |
| `accounts` | Accounts | View pending invoices, verify proof-of-payment, release the application to the NRSO queue. |
| `admin` | System Administrator | Anything any role can do; assign roles; edit the fee schedule; revoke licences; view the global audit log. |
| `nrso_insp` / `snrso_insp` | Inspection roles | Phase 2 — inspection module. Reserved keys; no Phase 1 endpoints. |
| `techcom` | Technical Committee | Phase 2 — TECHCOM module. |
| `board_chair` | Board Chairperson | Phase 2 — review of escalated cases. |

Permission checks live in `backend/irms/permissions.py` and are applied at
the DRF view layer. Workflow-stage gates live in `backend/apps/workflow/states.py`.
