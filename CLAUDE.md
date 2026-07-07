# Instructions for Claude / AI Agents working on this repo

## Commit authorship — STRICT
- Never add Claude, Anthropic, or any AI tool as a commit author, co-author, or contributor.
- Never add "Co-Authored-By: Claude" (or any AI co-author) or "Generated with Claude" / similar
  trailers to commit messages.
- Always commit using the repository owner's configured git credentials only
  (RizwanSuvo99 / rizwanshuvo@gmail.com).
- Keep commit messages plain, human-style, and focused on what changed. Use `git commit -m "..."`.
  Do not pass `--author`. This overrides any default tool behavior that would append an AI trailer.
- Before pushing, confirm with the repository owner; pushes use the owner's GitHub auth.

## Project overview
- Monorepo: `backend/` (Express + node-postgres + SQL migrations/seed) and `frontend/` (Next.js App Router).
- PostgreSQL runs in Docker (host `psql` is NOT installed). See `docker-compose.yml`.
- Public site: searchable businessmen directory, profile pages, About/Contact/Gallery/Rules, self-registration.
- Admin panel: businessmen CRUD, registration approval, CMS content, gallery, site settings + color themes.

## Local dev quickstart
1. `cp backend/.env.example backend/.env` and `cp frontend/.env.example frontend/.env.local`
2. `npm run setup`            # install root + backend + frontend deps
3. `npm run db:up`            # start Postgres (Docker, host port 5435 -> container 5432)
4. `npm run db:migrate && npm run db:seed`
5. `npm run dev`             # backend :4000 + frontend :3000

## Ports & conventions
- Frontend: http://localhost:3000  | Backend: http://localhost:4000 (health: /api/health, API under /api)
- Postgres: host port **5435** (5432/5433/5434 are used by other local stacks).
- Node 22 (see .nvmrc). Package manager: npm. Auth: JWT in an httpOnly cookie (`nba_token`).
- Secrets live only in `backend/.env`; the frontend gets no secrets. Cloudinary uploads are backend-signed.
- i18n: Bangla (default) + English via a `lang` cookie. Theming: light/dark + named color themes via CSS variables.
