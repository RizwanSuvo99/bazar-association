# Agent Prompt: নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা — Web Application

## 0. Role & Objective

You are building a full-stack web application for **"নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা" (Nangalkot Bazar Business Association)** — a registered organization of local businessmen. The core purpose of the platform is to maintain a **central searchable database of registered businessmen**, presented publicly as profiles, alongside an informational site and a fully admin-managed CMS.

Work autonomously through the full stack (DB schema + seed data → backend API → frontend → git). Ask for clarification only if something is truly ambiguous; otherwise make a reasonable decision, document it in comments/README, and proceed.

---

## 1. Git Setup — DO THIS FIRST

- Repository URL: **https://github.com/RizwanSuvo99/bazar-association**
- Steps:
  1. `git init` in the project root.
  2. `git remote add origin https://github.com/RizwanSuvo99/bazar-association`
  3. Make commits at logical checkpoints (schema done, backend API done, admin panel done, public site done, etc.) — not just one giant final commit.
  4. Push to `origin main` (create the `main` branch if it doesn't exist).
- **Author/committer identity rule (CRITICAL):**
  - Do **NOT** add Claude as a contributor, co-author, or author in any commit.
  - Do **NOT** add "Generated with Claude" / "Co-Authored-By: Claude" or any similar trailer to commit messages.
  - Use **only the user's configured git credentials** (name/email already set in local git config, or the credentials the user provides) for every commit.
  - Add a **`CLAUDE.md`** file at the project root that explicitly states this rule, so it persists for any future Claude Code sessions on this repo. Example content to include in `CLAUDE.md`:
    ```
    # Instructions for Claude / AI Agents working on this repo

    - Never add Claude, Anthropic, or any AI tool as a commit author, co-author, or contributor.
    - Never add "Co-Authored-By: Claude" or similar trailers to commit messages.
    - Always commit using the repository owner's configured git credentials only.
    - Keep commit messages plain, human-style, and focused on what changed.
    ```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Node.js / Express |
| Database | PostgreSQL — set up **locally**, include a seed script with dummy data |
| Image storage | Cloudinary (credentials will be supplied via `.env` — use env vars, never hardcode) |
| i18n | Bangla (default) + English, toggle from navbar |
| Theming | Light/Dark mode toggle in navbar on every page; additionally, **multiple named color themes** configurable from the Admin Panel (see §7) |

---

## 3. Public-Facing Site — Pages & Features

1. **Home page**
   - Shows all registered businessmen as profile cards (photo, name, business type, market name, etc.)
   - Search/filter bar — support search by name, market name, business type, union/ward, mobile number, etc. (design a sensible filter UI; don't over-engineer, but make it genuinely useful).
   - Each profile card links to a full profile detail page.

2. **Businessman Profile Detail Page**
   - Route pattern: **`/profiles/{last-6-digits-of-NID}`** e.g. `/profiles/235192`
   - Displays all registration fields (see §5) in a clean, organized layout (grouped into sections: Personal Info, Address, Business Info, Nominee Info, IDs).

3. **About Us page** — content editable from admin panel.

4. **Contact Us page** — content editable from admin panel (include a contact form or at least displayed contact info — your call, keep it simple).

5. **Gallery page** — displays images uploaded via admin (Cloudinary-hosted), grid layout.

6. **সংস্থার নিয়মকানুন (Association Rules) page** — content editable from admin panel.

7. **Public Registration Request Form** (new businessman self-registration)
   - Any visitor can submit an application with all fields from §5.
   - Must clearly display: **"রেজিষ্ট্রেশন ফি ৫০০ টাকা"** (Registration fee: 500 Taka) with the **bKash number** to send money to (make this configurable from admin, not hardcoded).
   - Include a required field for **Transaction ID** (bKash transaction proof).
   - Submissions go into a `pending` queue — they do **not** appear on the public site until admin approves.

8. **Language toggle** (বাংলা / English) in navbar — **Bangla is default**. All public pages and admin-editable content should support both languages (structure DB fields as bilingual where relevant, e.g. `title_bn` / `title_en`, or use a simple i18n JSON approach for static UI strings + bilingual content fields for admin-managed content).

9. **Light/Dark mode toggle** in navbar — persists across pages (e.g. via cookie or localStorage-equivalent server-safe approach for Next.js).

---

## 4. Admin Panel — Features

Admin-only login (no client/business-owner login needed at this stage).

1. **Businessman CRUD**
   - Create new registered businessman directly (bypassing the public request flow).
   - Read/list all businessmen with search/filter.
   - Update any businessman's info.
   - Delete/deactivate a businessman.
   - On create, auto-generate the unique ID from NID last 6 digits (see §6).

2. **Registration Request Management**
   - View all pending public registration requests.
   - Approve → creates a full businessman record + generates unique ID + moves to public listing.
   - Reject → mark as rejected (keep record for audit, don't hard-delete, but don't show publicly).

3. **Page Content Management (CMS-lite)**
   - Admin can edit content for: About Us, Contact Us, নিয়মকানুন (Rules), and Home page intro/hero text.
   - Support bilingual content editing (BN/EN fields side by side, or a language tab in the editor).

4. **Gallery Management**
   - Upload images (via Cloudinary), with CRUD (add/delete/reorder/caption).

5. **Site Settings**
   - Configurable bKash number for registration fee.
   - Configurable registration fee amount (default 500, but editable).
   - **Color theme selector**: admin can choose/switch between multiple predefined color theme profiles (e.g. "Emerald", "Royal Blue", "Warm Amber" — pick 3-4 tasteful options) that change the overall site's primary/accent colors sitewide. Store the active theme in DB/settings table; apply via CSS variables.

6. **Admin authentication**
   - Simple secure login (email/username + hashed password, JWT or session-based — your choice, but must be production-reasonable, not a toy stub).

---

## 5. Registration / Businessman Data Fields

Capture and store all of the following per businessman (Bangla labels kept for the actual form fields shown to users; use clear English field names in the DB schema):

| # | Bangla Label | Field (suggested) |
|---|---|---|
| 1 | সদস্যের নাম | `full_name` |
| 2 | মোবাইল নং | `mobile_number` |
| 3 | পিতার নাম | `father_name` |
| 4 | মাতার নাম | `mother_name` |
| 5 | স্থায়ী ঠিকানা (গ্রাম, ডাকঘর, পৌরসভা/ইউনিয়ন, উপজেলা, জেলা) | `permanent_address` (structured: village, post_office, municipality_or_union, upazila, district) |
| 6 | বর্তমান প্রতিষ্ঠানের নাম ও ঠিকানা | `current_business_name_address` |
| 7 | ব্যবসার ধরণ | `business_type` |
| 8 | ট্রেড লাইসেন্স নং | `trade_license_no` |
| 9 | টিআইএন নং | `tin_no` |
| 10 | মার্কেটের নাম | `market_name` |
| 11 | মালিকের নাম | `owner_name` |
| 12 | পৌরসভা ওয়ার্ড নং | `ward_no` |
| 13 | হোল্ডিং নং | `holding_no` |
| 14 | ভোটারের ধরণ | `voter_type` (fixed value: "ব্যবসায়ী" / "Businessman") |
| 15 | জাতীয় পরিচয়পত্র নং | `nid_no` |
| 16 | রক্তের গ্রুপ | `blood_group` |
| 17 | নমিনীর নাম | `nominee_name` |
| 18 | নমিনীর সাথে সম্পর্ক | `nominee_relation` |
| 19 | নমিনীর মোবাইল নং | `nominee_mobile` |

Plus system-managed fields: `unique_id` (e.g. `NBA-235192`), `status` (pending/approved/rejected/active/inactive), `profile_photo_url` (Cloudinary), `transaction_id` (for the 500tk fee proof, on the request form), `created_at`, `updated_at`.

---

## 6. Business Rules

1. **Registration fee**: 500 Taka, clearly stated on the request form, with an admin-configurable bKash number to send it to, and a required Transaction ID field for proof.
2. **Unique ID generation**: Take the **last 6 digits of the NID number**, prefix with `NBA-`. Example: NID ending in `235192` → **`NBA-235192`**.
3. **Profile route**: `/profiles/{last-6-digits}` e.g. `/profiles/235192` (the route param is the 6-digit number, without the `NBA-` prefix — confirm this matches §3.2 example given).
4. **Bilingual site**: Bangla default, English toggle available from navbar. All static UI text and admin-editable content must support both.
5. **Light/Dark mode**: available on every page, toggle in navbar.

---

## 7. Design Direction

- Modern, minimal aesthetic — avoid generic Bootstrap-looking defaults; use intentional typography, spacing, and a refined color palette per selected theme.
- Feel free to add small original touches (e.g. a subtle pattern motif referencing the market/bazar theme, a clean profile card design, a nice empty-state for search, etc.) to make the site feel distinctive rather than templated.
- Populate the site now with realistic **dummy Bangla text and placeholder images** for all content (About Us, Rules page, Gallery, ~10-15 dummy businessman profiles) so the site is demo-ready. Admin will replace this content later.
- Multiple color theme profiles must be genuinely swappable from admin settings — implement via CSS custom properties (CSS variables) so switching a theme doesn't require redeploying.

---

## 8. Database & Seed Data

- Use PostgreSQL, running locally.
- Design normalized tables: `businessmen`, `registration_requests` (or unify with a `status` field on `businessmen`), `gallery_images`, `page_content` (for About/Contact/Rules/Home, bilingual), `site_settings` (bKash number, fee amount, active theme), `admins`.
- Write a seed script that populates: several dummy approved businessmen profiles (with varied data across all fields), a couple of pending registration requests, sample gallery images, sample About/Contact/Rules content in both languages, and one admin user (document the seeded admin login credentials in the README — do not commit real secrets).

---

## 9. Cloudinary

- Integrate Cloudinary for all image uploads (profile photos, gallery images).
- Read credentials from environment variables (`.env`, gitignored). The user will supply the actual Cloudinary credentials separately — use placeholder env var names (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and document them in `.env.example`.

---

## 10. Deliverable Checklist

- [ ] `git init`, remote set to `https://github.com/RizwanSuvo99/bazar-association`, commits made under user's identity only, `CLAUDE.md` added with the no-AI-author rule.
- [ ] Postgres schema + migration files + seed script (with dummy data) working locally.
- [ ] Express backend API: auth (admin), businessmen CRUD, registration request submit/approve/reject, gallery CRUD, page content CRUD, site settings CRUD.
- [ ] Next.js frontend: Home (search/list), Profile detail page (`/profiles/:id`), About, Contact, Gallery, Rules, Registration Request form, language toggle (BN default/EN), light/dark toggle.
- [ ] Admin panel: login, businessmen CRUD, request approval workflow, content editor, gallery manager, site settings incl. theme switcher and bKash/fee config.
- [ ] `.env.example` with all required env vars documented.
- [ ] `README.md` with setup instructions (DB setup, running seed, running dev servers, seeded admin credentials).
- [ ] Final commit + push to the repo, verified clean history with proper (non-AI) authorship.

---

## 11. Open Points to Decide Sensibly (don't block on these — just choose and document)

- Exact list of predefined color themes (pick 3-4 sensible, cohesive palettes).
- Auth mechanism details for admin (JWT vs session) — pick JWT with httpOnly cookie unless there's a reason not to.
- Exact structure of bilingual storage for admin content (side-by-side `_bn`/`_en` columns is the simplest and recommended approach).
