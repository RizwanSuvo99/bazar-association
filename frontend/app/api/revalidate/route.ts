import { NextResponse } from "next/server";

// Admin-editable data is fetched with `no-store`, so it always reflects the latest values
// and no explicit cache invalidation is required. This endpoint is kept as a harmless no-op
// so the client-side helper can call it without error.
export async function POST() {
  return NextResponse.json({ ok: true });
}
