# নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা — Nangalkot Bazar Business Association

A full-stack web application for a registered association of local businessmen. It provides a public,
searchable **directory of registered businessmen** (with individual profile pages), informational pages
(About, Rules, Gallery, Contact), a public self-registration flow with a payment step, and a fully
admin-managed CMS.

## Features

**Public site**
- Home hero with a **customizable image carousel** (cover images managed from the admin panel)
- Home directory with search + filters (name, business type, market, ward, mobile) and pagination
- Businessman profile pages at `/profiles/{last-6-digits-of-NID}` (e.g. `/profiles/235192`)
  — sensitive IDs (NID/TIN) are **masked** for privacy
- About, নিয়মকানুন (Rules), Gallery (with lightbox) and Contact pages (all admin-editable)
- **Notice board** — anyone can view or download the notice PDFs uploaded by the admin
- Public registration request form — **500 Taka fee** with a configurable bKash number, a **required
  photo upload**, and a required bKash **Transaction ID**; submissions wait in a pending queue
- **বাংলা / English** toggle (Bangla default) and **light / dark** mode toggle on every page

**Admin panel** (`/admin`)
- Secure login (JWT in an httpOnly cookie, bcrypt-hashed passwords)
- Businessmen CRUD (auto-generates the `NBA-######` id from the NID)
- **Download a member's info as a filled registration-form PDF** — overlays the data (in Noto Serif
  Bengali) onto the association's official form image, preserving its font, watermark, and signatures
- **Member ID cards (with QR)** — download a portrait badge per member, or **all members in bulk**
  (grid on A4 sheets, for printing). Scanning a card's QR opens that member's registration form
- Registration request queue with **approve** (creates a member) / **reject** (kept for audit)
- Bilingual page-content editor (About / Rules / Contact / Home hero)
- Gallery manager (upload, caption, reorder, delete)
- Notice manager — **upload notice PDFs**, publish/hide, delete (files stored on the server so public
  view/download always works; Cloudinary blocks PDF delivery by default)
- Site settings: **hero carousel images** (multi-upload/reorder), **color theme** switcher
  (Emerald / Royal Blue / Warm Amber / Crimson), bKash number, registration fee, and org/contact info
- Contact-message inbox

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) · React · TypeScript · Tailwind CSS v4 |
| Backend | Node.js · Express · raw SQL via `node-postgres` |
| Database | PostgreSQL 16 (runs in Docker) |
| Auth | JWT in an httpOnly cookie · bcrypt |
| Images | Cloudinary (with a local-disk fallback) |
| i18n | Bangla (default) + English, via a `lang` cookie + JSON dictionaries |
| Theming | CSS custom properties — light/dark + named color themes |

---

## Prerequisites

- **Node.js 22** (see `.nvmrc`) and npm
- **Docker** + Docker Compose v2 — PostgreSQL runs in a container, so a native `psql`/Postgres install
  is **not** required
- git
- **Python 3 with Pillow** (built with `raqm`) — only for the admin "registration-form PDF" export,
  which renders the filled Bangla form server-side. Preinstalled on most Linux/macOS. (Check with
  `python3 -c "from PIL import features; print(features.check('raqm'))"` → should print `True`.)

## Getting started

```bash
# 1. Environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
#    (optional) add your CLOUDINARY_* credentials in backend/.env for image uploads
#    — without them, uploads fall back to local disk so the app still works.

# 2. Install all dependencies (root + backend + frontend)
npm run setup

# 3. Start PostgreSQL (Docker; host port 5435 -> container 5432)
npm run db:up

# 4. Create the schema and load demo data
npm run db:migrate
npm run db:seed

# 5. Run both apps (backend :4000, frontend :3000)
npm run dev
```

Then open:

- **Public site:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin
- **API health:** http://localhost:4000/api/health

A ready demo profile: http://localhost:3000/profiles/235192

## Seeded admin credentials

| Field | Value |
|---|---|
| Email | `admin@nangalkotbazar.com` |
| Password | `Admin@12345` |

(From `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env` — change them for production.)

## Handy scripts (run from the repo root)

| Script | Purpose |
|---|---|
| `npm run setup` | Install root + backend + frontend deps |
| `npm run db:up` | Start Postgres in Docker (waits until healthy) |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:seed` | Load demo data |
| `npm run db:reset` | Destroy the DB volume and recreate an empty Postgres |
| `npm run db:psql` | Open a `psql` shell inside the container |
| `npm run bootstrap` | db:up + migrate + seed in one command |
| `npm run dev` | Run backend + frontend together |

---

## Environment variables

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default 4000) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:3000`) |
| `DATABASE_URL` | Postgres connection string (`...@localhost:5435/nangalkot_bazar`) |
| `JWT_SECRET` | Secret for signing the auth JWT |
| `JWT_EXPIRES_IN` / `BCRYPT_ROUNDS` | Token lifetime / bcrypt cost |
| `COOKIE_NAME` / `COOKIE_SECURE` / `COOKIE_SAMESITE` | Auth cookie settings |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary (optional) |
| `CLOUDINARY_UPLOAD_FOLDER` | Cloudinary folder prefix |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seeded admin account |

**`frontend/.env.local`**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Browser-facing API base (default `http://localhost:4000`) |
| `API_INTERNAL_BASE_URL` | Server-component API base |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (metadata) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Default language (`bn`) |

Secrets live **only** in `backend/.env` (gitignored); the frontend gets no secrets. Both `.env.example`
files are committed.

## Project structure

```
bazar-association/
├── docker-compose.yml        # Postgres (host 5435 -> 5432)
├── package.json              # root orchestration scripts (concurrently)
├── CLAUDE.md                 # repo authorship rules for AI agents
├── backend/                  # Express API
│   └── src/
│       ├── db/{migrations,seeds,migrate.js,seed.js}
│       ├── models/           # raw-SQL data access
│       ├── controllers/  routes/  middleware/  validators/  services/  utils/  config/
│       └── index.js  app.js
└── frontend/                 # Next.js App Router
    ├── app/(public)/         # public pages (Home, profile, About, Rules, Gallery, Contact, Register)
    ├── app/admin/            # login + gated (panel) routes
    ├── components/           # ui, layout, public, profile, register, admin
    ├── lib/                  # api client, i18n, theme, queries, types
    ├── dictionaries/         # bn.json / en.json
    └── proxy.ts              # admin route guard
```

## API overview

Public: `GET /api/health`, `/api/settings`, `/api/pages[/:key]`, `/api/gallery`, `/api/businessmen`
(search), `/api/businessmen/facets`, `/api/profiles/:sixDigits`; `POST /api/registration-requests`,
`/api/contact-messages`, `/api/uploads/registration-photo`.

Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Admin (cookie-protected, under `/api/admin`): businessmen CRUD, registration-request
list/approve/reject, gallery CRUD + reorder, page-content update, settings update, contact-message
list/read, image upload, dashboard stats.

## Database & data notes

- Data persists in the Docker named volume `nba_pgdata`. Reset with `npm run db:reset` then
  `npm run db:migrate && npm run db:seed`.
- The `unique_id` (`NBA-######`) and the profile route key are **generated columns** derived from the
  last 6 digits of the NID, with a UNIQUE index that guards against collisions.
- The seed loads 12 approved businessmen (varied Bangla data), 3 registration requests (2 pending,
  1 rejected), a gallery, bilingual page content, and site settings.

## Cloudinary

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `backend/.env` to send
uploads to Cloudinary. If they are not set, uploads are saved to `backend/uploads/` and served from
`/uploads/*`, so the required registration photo always works. Uploads are backend-signed — the
frontend never sees Cloudinary secrets.

## Deployment (production)

Live at **https://nangalkotbazar.com**, on an Ubuntu 24.04 VPS.

| Piece | Where |
|---|---|
| App | `/opt/bazar-association`, owned by the `nba` system user |
| API | `nba-backend.service` → `node src/index.js` on `:4000` |
| Web | `nba-frontend.service` → `next start` on `127.0.0.1:3000` |
| Proxy | Nginx: `/api/` → `:4000`, everything else → `:3000`, TLS via certbot |
| DB | Postgres in Docker, bound to `127.0.0.1:5435` only |
| Backups | Nightly `pg_dump` at 03:00, 14 days retained in `/opt/backups/db` |

**Every push to `main` deploys automatically** via `.github/workflows/deploy.yml`:

1. **Build & typecheck** — installs both workspaces, `node --check` on the backend, `tsc --noEmit`
   and `next build` on the frontend. Runs on pull requests too.
2. **Deploy** — only if step 1 passed. SSHes to the VPS, where the key is pinned to a *forced
   command* so it can only run [`deploy/nba-deploy.sh`](./deploy/nba-deploy.sh) — it cannot open a
   shell. That script pulls, installs, migrates, rebuilds, restarts, and health-checks. If the
   build fails it rolls back to the previous commit and leaves the running services untouched.

Repo secrets required: `VPS_HOST`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.

Note that `deploy/nba-deploy.sh` is a reference copy — the server runs `/usr/local/bin/nba-deploy`,
which must be updated by hand (a deploy should not rewrite itself mid-run).

## Authorship

See [`CLAUDE.md`](./CLAUDE.md): commits use the repository owner's git identity only.
