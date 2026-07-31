import "server-only";
import { apiData, apiFetch } from "./api";
import type {
  AdminAccount,
  Businessman,
  ContactMessage,
  DashboardStats,
  GalleryImage,
  ListMeta,
  Notice,
  RegistrationRequest,
} from "./types";

const noStore = { cache: "no-store" as const };

export const getAdminStats = () => apiData<DashboardStats>("/admin/stats", noStore);

export async function getAdminBusinessmen(query: {
  q?: string;
  status?: string;
  page?: string | number;
}): Promise<{ items: Businessman[]; meta: ListMeta }> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page || 1));
  params.set("limit", "20");
  const res = await apiFetch<Businessman[]>(`/admin/businessmen?${params.toString()}`, noStore);
  return { items: res.data, meta: res.meta ?? { page: 1, limit: 20, total: res.data.length, totalPages: 1 } };
}

export const getAdminBusinessman = (id: string) =>
  apiData<Businessman>(`/admin/businessmen/${id}`, noStore);

export async function getAdminRequests(
  status?: string,
  page: string | number = 1,
  limit = 20,
): Promise<{ items: RegistrationRequest[]; meta: ListMeta }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page || 1));
  params.set("limit", String(limit));
  const res = await apiFetch<RegistrationRequest[]>(`/admin/registration-requests?${params.toString()}`, noStore);
  return { items: res.data, meta: res.meta ?? { page: 1, limit, total: res.data.length, totalPages: 1 } };
}

export const getAdminRequest = (id: string) =>
  apiData<RegistrationRequest>(`/admin/registration-requests/${id}`, noStore);

export const getAdminGallery = () => apiData<GalleryImage[]>("/admin/gallery", noStore);

export async function getAdminNotices(
  page: string | number = 1,
  limit = 15,
): Promise<{ items: Notice[]; meta: ListMeta }> {
  const res = await apiFetch<Notice[]>(`/admin/notices?page=${page || 1}&limit=${limit}`, noStore);
  return { items: res.data, meta: res.meta ?? { page: 1, limit, total: res.data.length, totalPages: 1 } };
}

export async function getAdminMessages(
  page: string | number = 1,
  limit = 15,
): Promise<{ items: ContactMessage[]; meta: ListMeta }> {
  const res = await apiFetch<ContactMessage[]>(`/admin/contact-messages?page=${page || 1}&limit=${limit}`, noStore);
  return { items: res.data, meta: res.meta ?? { page: 1, limit, total: res.data.length, totalPages: 1 } };
}

/** Admin accounts — the API restricts this to superadmins, so callers must handle a 403. */
export const getAdminUsers = () => apiData<AdminAccount[]>("/admin/admins", noStore);
