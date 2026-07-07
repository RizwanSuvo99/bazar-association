import "server-only";
import { apiData } from "./api";
import type { AdminUser } from "./types";

/** Returns the current admin (from the httpOnly cookie) or null. Server-side only. */
export async function getSession(): Promise<AdminUser | null> {
  try {
    const data = await apiData<{ admin: AdminUser }>("/auth/me", { cache: "no-store" });
    return data.admin;
  } catch {
    return null;
  }
}
