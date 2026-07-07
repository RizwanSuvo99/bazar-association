import type { ListMeta } from "./types";

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: ListMeta;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: { path: string; message: string }[];
  constructor(status: number, message: string, code?: string, details?: ApiError["details"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
  body?: BodyInit;
  tags?: string[];
  revalidate?: number | false;
}

function baseUrl(isServer: boolean) {
  if (isServer) return process.env.API_INTERNAL_BASE_URL || "http://localhost:4000";
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
}

/** Environment-aware fetch to the Express API. Returns the full { data, meta } envelope. */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<Envelope<T>> {
  const isServer = typeof window === "undefined";
  const headers = new Headers(options.headers);

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  // On the server, forward the incoming request cookies so the API can authorize admin calls.
  if (isServer) {
    const { cookies } = await import("next/headers");
    const cookieHeader = (await cookies()).toString();
    if (cookieHeader) headers.set("cookie", cookieHeader);
  }

  const nextOpts: { tags?: string[]; revalidate?: number | false } = {};
  if (options.tags) nextOpts.tags = options.tags;
  if (options.revalidate !== undefined) nextOpts.revalidate = options.revalidate;

  const res = await fetch(baseUrl(isServer) + "/api" + path, {
    ...options,
    headers,
    body,
    credentials: isServer ? undefined : "include",
    ...(Object.keys(nextOpts).length ? { next: nextOpts } : {}),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    const err = payload?.error;
    throw new ApiError(res.status, err?.message || "অনুরোধ ব্যর্থ হয়েছে।", err?.code, err?.details);
  }
  return payload as Envelope<T>;
}

/** Convenience: return just the data. */
export async function apiData<T>(path: string, options: FetchOptions = {}): Promise<T> {
  return (await apiFetch<T>(path, options)).data;
}
