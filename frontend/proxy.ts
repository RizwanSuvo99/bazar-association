import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "nba_token";

// Member profiles used to be addressed by the last 6 digits of the NID (/profiles/314538).
// That tail is not unique, so profiles moved to a dedicated slug — but the six-digit URLs are
// already indexed by search engines, so they have to keep working.
//
// Resolved here rather than in the page itself on purpose: calling permanentRedirect() inside
// the server component emits the redirect *inside the streamed response body*, after the 200
// status line has already been sent. A browser follows that, but a crawler records a 200 and the
// indexed URL never moves. The proxy answers before rendering starts, so this is a real 308.
const LEGACY_PROFILE = /^\/profiles\/(\d{6})\/?$/;

async function redirectLegacyProfile(req: NextRequest) {
  const match = LEGACY_PROFILE.exec(req.nextUrl.pathname);
  if (!match) return null;

  const api = process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!api) return null;

  try {
    const res = await fetch(`${api}/api/profiles/${match[1]}`, { cache: "no-store" });
    if (!res.ok) return null; // unknown id — let the page render its own 404
    const slug: unknown = (await res.json())?.data?.profile_slug;
    if (typeof slug !== "string" || !slug) return null;

    const url = req.nextUrl.clone();
    url.pathname = `/profiles/${slug}`;
    return NextResponse.redirect(url, 308);
  } catch {
    // An unreachable API must not turn a profile URL into an error page.
    return null;
  }
}

// Next.js 16 "proxy" convention (formerly "middleware").
// Fast presence check at the edge; the admin layout does the authoritative /auth/me check.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/profiles/")) {
    return (await redirectLegacyProfile(req)) ?? NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/profiles/:slug"],
};
