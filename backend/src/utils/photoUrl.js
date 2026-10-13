import { env } from '../config/env.js';

/**
 * Where a member's photo may legitimately be fetched from.
 *
 * `profile_photo_url` is not ours to trust: the public registration form accepts any URL the
 * applicant types (validators/registration.schema.js), and that value becomes the member's
 * photo once an admin approves them. Every server-side fetch of it — the ID-card renderer,
 * the member form page, the Excel export — would otherwise be a request generator aimed
 * wherever the applicant likes, including 127.0.0.1 and the private network this VPS sits
 * on. So the origin is matched against a list instead of being trusted.
 *
 * Photos upload to Cloudinary. The local-disk fallback in upload.controller.js serves them
 * from this app's own /uploads/ path, which is why that origin is allowed as well — and only
 * under that one path prefix. `new URL()` has already resolved any `..` by the time the
 * prefix is checked, so the path cannot be walked out of.
 */
const CLOUDINARY_HOST = 'res.cloudinary.com';

// The avatar host the dev seed uses. Never allowed in production, where every photo on file
// is a Cloudinary URL.
const DEV_HOSTS = env.isProd ? [] : ['i.pravatar.cc'];

const OWN_ORIGINS = new Set(
  [env.PUBLIC_SITE_URL, env.CORS_ORIGIN, `http://localhost:${env.PORT}`, `http://127.0.0.1:${env.PORT}`]
    .map((base) => {
      try {
        return new URL(base).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean),
);

/** True only for a URL this server is willing to fetch a member photo from. */
export function isAllowedPhotoUrl(raw) {
  if (typeof raw !== 'string' || !raw) return false;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol === 'https:' && (url.hostname === CLOUDINARY_HOST || DEV_HOSTS.includes(url.hostname))) {
    return true;
  }
  return OWN_ORIGINS.has(url.origin) && url.pathname.startsWith('/uploads/');
}
