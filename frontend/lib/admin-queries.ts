import "server-only";
import { apiData, apiFetch } from "./api";
import type {
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

export const getAdminRequests = (status?: string) =>
  apiData<RegistrationRequest[]>(
    `/admin/registration-requests${status ? `?status=${status}` : ""}`,
    noStore,
  );

export const getAdminRequest = (id: string) =>
  apiData<RegistrationRequest>(`/admin/registration-requests/${id}`, noStore);

export const getAdminGallery = () => apiData<GalleryImage[]>("/admin/gallery", noStore);

export const getAdminNotices = () => apiData<Notice[]>("/admin/notices", noStore);

export const getAdminMessages = () => apiData<ContactMessage[]>("/admin/contact-messages", noStore);
