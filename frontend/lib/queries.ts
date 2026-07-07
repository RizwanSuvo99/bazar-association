import { apiData } from "./api";
import type {
  Businessman,
  Facets,
  GalleryImage,
  ListMeta,
  PageContent,
  SiteSettings,
} from "./types";
import { apiFetch } from "./api";

export function getSettings() {
  return apiData<SiteSettings>("/settings", { tags: ["settings"], revalidate: 300 });
}

export function getPages() {
  return apiData<Record<string, PageContent>>("/pages", { tags: ["content"], revalidate: 300 });
}

export function getPage(key: string) {
  return apiData<PageContent>(`/pages/${key}`, { tags: ["content"], revalidate: 300 });
}

export function getGallery() {
  return apiData<GalleryImage[]>("/gallery", { tags: ["gallery"], revalidate: 120 });
}

export function getFacets() {
  return apiData<Facets>("/businessmen/facets", { tags: ["members"], revalidate: 120 });
}

export function getProfile(sixDigits: string) {
  return apiData<Businessman>(`/profiles/${sixDigits}`, { cache: "no-store" });
}

export interface MemberQuery {
  q?: string;
  business_type?: string;
  market?: string;
  ward?: string;
  page?: string | number;
  limit?: string | number;
  sort?: string;
}

export async function getBusinessmen(
  query: MemberQuery = {},
): Promise<{ items: Businessman[]; meta: ListMeta }> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  const res = await apiFetch<Businessman[]>(`/businessmen${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  return {
    items: res.data,
    meta: res.meta ?? { page: 1, limit: 12, total: res.data.length, totalPages: 1 },
  };
}
