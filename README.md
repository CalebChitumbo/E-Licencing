# RPA-IRMS — Integrated Regulatory Information Management System

A purpose-built licensing, inspection, and compliance platform for the
**Radiation Protection Authority of Zambia**, replacing the IAEA RAIS+ system.

## Architecture

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui |
| Backend | Django 5 + Django REST Framework (Python 3.12) |
| Database | Cloud Firestore (Native mode) |
| Auth | Firebase Authentication (+ TOTP) |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting (frontend) + Cloud Run (backend) |
| Region | `africa-south1` (Johannesburg) |

Django acts as a stateless API layer that authenticates Firebase ID tokens
and proxies every write through the Admin SDK; the Firestore security rules
deny direct client writes.

## Phase 1 (MVP) scope

End-to-end loop: applicant registers → adds a facility → submits **Form I**
(new licence) → invoice generated → accounts verifies payment → application
routes through NRSO → SNRSO → MNRS → DNRS → ED → licence PDF generated and
digitally signed → public verification.

See [`docs/`](./docs/) for the full data model, workflow, and role matrix.

## Repository layout

```
backend/        Django REST API (Cloud Run)
frontend/       React SPA (Firebase Hosting)
infra/          Build + deployment config
docs/           SRS, data model, workflow, role matrix
firebase.json   Firebase project config
firestore.*     Security rules and indexes
```

## Quick start

Prereqs: Python 3.12, Node 20, Firebase CLI.

```bash
# 1. Install deps
make install

# 2. Start the Firebase emulators (separate terminal)
make emulators

# 3. Backend (separate terminal)
cp backend/.env.example backend/.env   # then edit
make backend

# 4. Frontend (separate terminal)
cp frontend/.env.example frontend/.env.local
make frontend
```

The Vite dev server is on `http://localhost:5173`, the Django API on
`http://localhost:8000`, and the Firebase Emulator UI on `http://localhost:4000`.

## Tests

```bash
make test         # backend pytest + frontend vitest
make lint         # ruff + eslint
make typecheck    # mypy + tsc
```

## Deployment

Frontend → Firebase Hosting (`firebase deploy --only hosting`).
Backend → Cloud Run via `infra/cloudbuild.yaml`.
Firestore rules + indexes → `firebase deploy --only firestore`.

## License

Proprietary — Radiation Protection Authority of Zambia.
