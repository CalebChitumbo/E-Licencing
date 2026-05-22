# Data model

All persisted data lives in Cloud Firestore. The Admin SDK bypasses
security rules; every write happens through Django. Document IDs are
deterministic where useful (`users/{uid}`, `licences/{number}`) and
auto-generated otherwise.

## Top-level collections

| Path | Document shape (Phase 1) |
|---|---|
| `users/{uid}` | `email`, `display_name`, `phone`, `role`, `is_active`, `mfa_enabled`, `created_at`, `last_login_at` |
| `facilities/{id}` | `owner_uid`, `name`, `type`, `legal_rep`, `pacra_number`, `gov_entity`, `rpo`, `address`, `province`, `district`, `gps`, `notification_contacts[]`, timestamps |
| `applications/{id}` | `form_type`, `applicant_uid`, `facility_id`, `facility_snapshot`, `current_stage`, `status`, `assigned_to_uid`, `submitted_at`, `wizard_data`, `fee_amount`, `invoice_id`, `licence_id`, `sla_deadline`, `info_request`, `rejected_reason`, timestamps |
| `invoices/{id}` | `application_id`, `applicant_uid`, `line_items[]`, `total`, `currency`, `status`, `payment_ref`, `proof_storage_path`, `verified_by`, `verified_at`, timestamps |
| `licences/{number}` | `licence_number`, `application_id`, `holder_uid`, `holder_name`, `facility_snapshot`, `issued_at`, `expires_at`, `conditions[]`, `status`, `pdf_storage_path`, `digital_signature_info` |
| `notifications/{id}` | `user_uid`, `template`, `subject`, `body`, `payload`, `channels[]`, `status`, `read_at`, timestamps |
| `audit_logs/{id}` | `actor_uid`, `actor_role`, `action`, `target_collection`, `target_id`, `details`, `timestamp` |
| `_counters/licences` | `{ "<year>": <int> }` — atomic counter for licence numbers |
| `_config/fees` | `{ fees: {FORM_I: 5000.0, ...}, currency: "ZMW" }` |

## Subcollections

| Path | Use |
|---|---|
| `facilities/{id}/sources/{id}` | Radiation sources owned by the facility |
| `facilities/{id}/workers/{id}` | Occupationally exposed workers (Phase 2 scope; collection reserved) |
| `applications/{id}/documents/{id}` | Supporting documents (PDF, images, DOCX) uploaded to Firebase Storage |
| `applications/{id}/audit/{id}` | Immutable per-application audit trail |
| `applications/{id}/comments/{id}` | Reserved for internal staff notes (Phase 2) |

## Denormalisation

Joins are not available in Firestore. To keep reads cheap:

- Every `application` carries a `facility_snapshot` captured at create time.
- Every `licence` carries the same snapshot — the licence remains valid
  even if the source facility is later edited.
- Public licence verification reads only the `licences/{number}` doc;
  no joins are issued.

## Composite indexes

Defined in `firestore.indexes.json`:

- `applications` by `applicant_uid` + `updated_at desc` — applicant dashboard
- `applications` by `current_stage` + `assigned_to_uid` + `submitted_at` — staff queue
- `applications` by `status` + `sla_deadline` — SLA reports
- `invoices` by `status` + `created_at desc` — accounts queue
- `facilities` by `owner_uid` + `updated_at desc`
- `notifications` by `user_uid` + `created_at desc`
- collection-group `audit` by `actor_uid` + `timestamp desc`
