import { pool, withTransaction, closePool } from '../config/db.js';
import { env } from '../config/env.js';
import { hashPassword } from '../utils/password.js';
import { sanitizeNid } from '../utils/digits.js';
import {
  businessmen,
  registrationRequests,
  galleryImages,
  pageContent,
  siteSettings,
  contactMessages,
  notices,
} from './seeds/data.js';

/** Build a parameterized INSERT for a row object with the given columns. */
async function insertRow(client, table, columns, row) {
  const values = columns.map((c) => row[c]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  await client.query(sql, values);
}

const BUSINESSMAN_COLUMNS = [
  'full_name', 'mobile_number', 'father_name', 'mother_name', 'blood_group',
  'village', 'post_office', 'municipality_or_union', 'upazila', 'district',
  'current_business_name_address', 'business_type', 'trade_license_no', 'tin_no',
  'market_name', 'owner_name', 'ward_no', 'holding_no', 'voter_type',
  'nid_no', 'nominee_name', 'nominee_relation', 'nominee_mobile', 'profile_photo_url', 'status',
];

const REQUEST_COLUMNS = [
  'full_name', 'mobile_number', 'father_name', 'mother_name', 'blood_group',
  'village', 'post_office', 'municipality_or_union', 'upazila', 'district',
  'current_business_name_address', 'business_type', 'trade_license_no', 'tin_no',
  'market_name', 'owner_name', 'ward_no', 'holding_no', 'voter_type',
  'nid_no', 'nominee_name', 'nominee_relation', 'nominee_mobile', 'profile_photo_url',
  'transaction_id', 'status', 'reject_reason',
];

async function run() {
  if (env.isProd && !process.argv.includes('--force')) {
    throw new Error('Refusing to seed in production without --force.');
  }

  // Guard against last-6 NID collisions in the demo data.
  const sixes = businessmen.map((b) => sanitizeNid(b.nid_no).slice(-6));
  const dupes = sixes.filter((s, i) => sixes.indexOf(s) !== i);
  if (dupes.length) {
    throw new Error(`Duplicate last-6 NID digits in seed businessmen: ${[...new Set(dupes)].join(', ')}`);
  }

  await withTransaction(async (client) => {
    await client.query(
      `TRUNCATE notices, contact_messages, gallery_images, page_content, registration_requests,
               businessmen, site_settings, admins
       RESTART IDENTITY CASCADE;`,
    );

    // Admin
    const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
    await client.query(
      `INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, 'superadmin')`,
      [env.SEED_ADMIN_NAME, env.SEED_ADMIN_EMAIL, passwordHash],
    );

    // Site settings (single row, id = 1)
    await client.query(
      `INSERT INTO site_settings
        (id, org_name_bn, org_name_en, bkash_number, registration_fee, active_theme, logo_url,
         contact_email, contact_phone, contact_address_bn, contact_address_en, facebook_url, hero_images)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        siteSettings.org_name_bn, siteSettings.org_name_en, siteSettings.bkash_number,
        siteSettings.registration_fee, siteSettings.active_theme, siteSettings.logo_url,
        siteSettings.contact_email, siteSettings.contact_phone, siteSettings.contact_address_bn,
        siteSettings.contact_address_en, siteSettings.facebook_url,
        JSON.stringify(siteSettings.hero_images ?? []),
      ],
    );

    // Businessmen (approved / active)
    for (const b of businessmen) {
      await insertRow(client, 'businessmen', BUSINESSMAN_COLUMNS, {
        ...b,
        nid_no: sanitizeNid(b.nid_no),
        voter_type: b.voter_type ?? 'ব্যবসায়ী',
        status: b.status ?? 'active',
      });
    }

    // Registration requests
    for (const r of registrationRequests) {
      await insertRow(client, 'registration_requests', REQUEST_COLUMNS, {
        ...r,
        nid_no: sanitizeNid(r.nid_no),
        voter_type: r.voter_type ?? 'ব্যবসায়ী',
        reject_reason: r.reject_reason ?? null,
      });
    }

    // Gallery
    for (const g of galleryImages) {
      await insertRow(client, 'gallery_images', ['image_url', 'caption_bn', 'caption_en', 'sort_order', 'is_published'], {
        ...g,
        is_published: g.is_published ?? true,
      });
    }

    // Page content
    for (const p of pageContent) {
      await client.query(
        `INSERT INTO page_content (page_key, title_bn, title_en, subtitle_bn, subtitle_en, body_bn, body_en, extra)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [p.page_key, p.title_bn, p.title_en, p.subtitle_bn, p.subtitle_en, p.body_bn, p.body_en, p.extra ?? {}],
      );
    }

    // Contact messages
    for (const m of contactMessages) {
      await insertRow(client, 'contact_messages', ['name', 'email', 'phone', 'subject', 'message', 'is_read'], m);
    }

    // Notices
    for (const nt of notices) {
      await insertRow(client, 'notices', ['title_bn', 'title_en', 'file_url', 'file_name', 'file_resource_type'], nt);
    }
  });

  const counts = await pool.query(`
    SELECT
      (SELECT count(*) FROM admins) AS admins,
      (SELECT count(*) FROM businessmen) AS businessmen,
      (SELECT count(*) FROM registration_requests) AS requests,
      (SELECT count(*) FROM gallery_images) AS gallery,
      (SELECT count(*) FROM page_content) AS pages,
      (SELECT count(*) FROM contact_messages) AS messages;
  `);
  console.log('Seed complete:', counts.rows[0]);
  console.log(`Admin login: ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);
}

run()
  .then(() => closePool())
  .catch(async (err) => {
    console.error(err);
    await closePool();
    process.exit(1);
  });
