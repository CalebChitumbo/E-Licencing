# Workflow

## State machine (Phase 1)

```
draft ─── submit ──► submitted ── accounts verify ──► nrso_review
                                                          │ approve
                                                          ▼
                                                     snrso_review
                                                          │ approve
                                                          ▼
                                                      mnrs_review
                                                          │ approve
                                                          ▼
                                                      dnrs_review
                                                          │ approve
                                                          ▼
                                                      ed_approval
                                                          │ approve  ◄── triggers licence generation
                                                          ▼
                                                   licence_generated (terminal)
```

Any review stage may also transition to:

- `info_requested` — `request_info` action. Returns the editing affordance
  to the applicant; on resubmit, the application re-enters the stage it
  came from.
- `rejected` — `reject` action. Terminal.

`assign` is a stage-internal transition that hands off `assigned_to_uid` to
another user with the same role (used by supervisors).

## Endpoints driving transitions

| Action | Endpoint |
|---|---|
| Submit a draft | `POST /api/v1/applications/{id}/submit` |
| Verify a payment (releases to NRSO) | `POST /api/v1/invoices/{id}/verify` |
| Approve / reject / request_info | `POST /api/v1/applications/{id}/transition` |
| ED approve (special — generates licence) | same as above; the view intercepts the case |
| Workflow config (read-only) | `GET /api/v1/workflow/config` |

## SLAs

A `sla_deadline` is recomputed on every transition (default: 5 business
days). Phase 2 will dispatch a Cloud Task at that deadline to email the
reviewer + supervisor; reaching 2× SLA escalates to the next role up.

## Audit

Every transition appends a doc to `applications/{id}/audit` with actor uid,
actor role, action, from-stage, to-stage, reason, and a timestamp. The
collection is append-only — Firestore security rules deny client writes,
and the API exposes no edit / delete endpoints.
