# নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা — Nangalkot Bazar Business Association

A full-stack web application for a registered association of local businessmen. It provides a public,
searchable **directory of registered businessmen** (with individual profile pages), informational pages
(About, Rules, Gallery, Contact), a public self-registration flow, and a fully admin-managed CMS.

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express (REST API)
- **Database:** PostgreSQL (runs in Docker)
- **Images:** Cloudinary (with a local-disk fallback)
- **i18n:** Bangla (default) + English toggle
- **Theming:** light/dark mode + multiple admin-selectable color themes

---

## Prerequisites

- **Node.js 22** (see `.nvmrc`) and npm
- **Docker** + Docker Compose v2 (PostgreSQL runs in a container — a native `psql`/Postgres install is **not** required)
- git

## Getting started

```bash
# 1. Environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
#    (optional) add your CLOUDINARY_* credentials in backend/.env for image uploads

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

## Seeded admin credentials

| Field | Value |
|---|---|
| Email | `admin@nangalkotbazar.test` |
| Password | `Admin@12345` |

(These come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env` — change them for production.)

## Handy scripts (run from repo root)

| Script | Purpose |
|---|---|
| `npm run setup` | Install root + backend + frontend deps |
| `npm run db:up` | Start Postgres in Docker (waits until healthy) |
| `npm run db:migrate` | Run SQL migrations |
| `npm run db:seed` | Load demo data |
| `npm run db:reset` | Destroy the DB volume and recreate an empty Postgres |
| `npm run db:psql` | Open a `psql` shell inside the container |
| `npm run dev` | Run backend + frontend together |

## Notes

- **Ports:** frontend `3000`, backend `4000`, Postgres host `5435` (5432–5434 are commonly used by other local stacks).
- **Cloudinary:** image uploads use Cloudinary when `CLOUDINARY_*` are set in `backend/.env`; otherwise files are
  saved to `backend/uploads/` and served from `/uploads/*` so the app works without any external credentials.
- **Authorship:** see [`CLAUDE.md`](./CLAUDE.md) — commits use the repository owner's identity only.

More detailed environment-variable and project-structure documentation is added in the final section of this
README as the project is completed.
