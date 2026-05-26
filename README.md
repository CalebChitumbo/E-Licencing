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
| Hosting | Vercel (SPA) + Cloud Run (API) + Firebase project (Auth/Firestore/Storage) |
| Region | `africa-south1` (Johannesburg) for Firestore + Cloud Run |

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
backend/        Django REST API (deployed to Cloud Run)
frontend/       React SPA (deployed to Vercel)
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

Three pieces deploy independently. None of them mutate each other — you can
ship the SPA without redeploying the API and vice-versa.

### 1. Firebase project (Auth + Firestore + Storage)

```bash
npm i -g firebase-tools && firebase login
firebase use <project-id>
firebase deploy --only firestore,storage    # rules + indexes
```
In the console: enable Email/Password auth, Firestore (Native, `africa-south1`),
and Storage. Generate a service-account JSON only if you need it for local
admin scripts — Cloud Run inherits credentials automatically.

### 2. Django API → Cloud Run

```bash
gcloud config set project <project-id>
gcloud config set run/region africa-south1

gcloud run deploy irms-api \
  --source=backend \
  --allow-unauthenticated \
  --set-env-vars="DJANGO_SETTINGS_MODULE=irms.settings.prod,\
FIREBASE_PROJECT_ID=<project-id>,\
FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com,\
DJANGO_SECRET_KEY=<generate-a-long-random-secret>,\
DJANGO_ALLOWED_HOSTS=<api-domain>,\
DJANGO_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>"
```
Cloud Run gives you a URL like `https://irms-api-xxxxx-zw.a.run.app`. Copy it
— the next step needs it. CI alternative: `infra/cloudbuild.yaml`.

### 3. SPA → Vercel

```bash
npm i -g vercel
cd frontend && vercel --prod
```
Then in the Vercel dashboard:

1. Open `frontend/vercel.json` and replace the `REPLACE_ME-…` placeholder
   with your Cloud Run URL. The rewrite proxies `/api/*` to Cloud Run so
   the browser never makes a cross-origin call and you can skip CORS.
2. Set these env vars in Vercel → Project → Settings → Environment Variables:
   ```
   VITE_API_BASE_URL=/api/v1
   VITE_FIREBASE_API_KEY=<from Firebase console>
   VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
   VITE_FIREBASE_APP_ID=<from Firebase console>
   VITE_USE_AUTH_EMULATOR=0
   VITE_PUBLIC_VERIFY_URL=https://<your-vercel-domain>/verify
   ```
3. Redeploy.

### Custom domains (optional, later)

Vercel → Settings → Domains → add `elicensing.rpa.gov.zm`.
Cloud Run → `gcloud run domain-mappings create --service=irms-api --domain=api.rpa.gov.zm`.
Update `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, and
`VITE_PUBLIC_VERIFY_URL` once the domains resolve.

## License

Proprietary — Radiation Protection Authority of Zambia.
