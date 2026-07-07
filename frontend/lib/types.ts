export type Lang = "bn" | "en";
export type ThemeName = "emerald" | "royal-blue" | "warm-amber" | "crimson";
export type Mode = "light" | "dark";

export interface Businessman {
  id: number | string;
  full_name: string;
  mobile_number: string;
  father_name?: string | null;
  mother_name?: string | null;
  blood_group?: string | null;
  village?: string | null;
  post_office?: string | null;
  municipality_or_union?: string | null;
  upazila?: string | null;
  district?: string | null;
  current_business_name_address?: string | null;
  business_type?: string | null;
  trade_license_no?: string | null;
  tin_no?: string | null;
  market_name?: string | null;
  owner_name?: string | null;
  ward_no?: string | null;
  holding_no?: string | null;
  voter_type?: string | null;
  nid_no?: string | null;
  nominee_name?: string | null;
  nominee_relation?: string | null;
  nominee_mobile?: string | null;
  profile_photo_url?: string | null;
  status: "active" | "inactive";
  six_digit_id: string;
  unique_id: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRequest extends Omit<Businessman, "six_digit_id" | "unique_id" | "status"> {
  transaction_id: string;
  status: "pending" | "approved" | "rejected";
  reject_reason?: string | null;
  businessman_id?: number | null;
  reviewed_at?: string | null;
}

export interface GalleryImage {
  id: number;
  image_url: string;
  cloudinary_public_id?: string | null;
  caption_bn?: string | null;
  caption_en?: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface PageContent {
  id: number;
  page_key: "home" | "about" | "contact" | "rules";
  title_bn?: string | null;
  title_en?: string | null;
  subtitle_bn?: string | null;
  subtitle_en?: string | null;
  body_bn?: string | null;
  body_en?: string | null;
  extra: Record<string, unknown>;
}

export interface SiteSettings {
  id: number;
  org_name_bn: string;
  org_name_en: string;
  bkash_number: string;
  registration_fee: number;
  active_theme: ThemeName;
  logo_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_address_bn?: string | null;
  contact_address_en?: string | null;
  facebook_url?: string | null;
  hero_images?: HeroImage[];
}

export interface HeroImage {
  url: string;
  public_id?: string | null;
}

export interface Notice {
  id: number;
  title_bn: string;
  title_en?: string | null;
  file_url: string;
  file_public_id?: string | null;
  file_resource_type: string;
  file_name?: string | null;
  is_published: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
}

export interface Facets {
  business_types: string[];
  markets: string[];
  wards: string[];
  unions: string[];
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardStats {
  businessmen: { total: number; active: number; inactive: number };
  requests: { pending: number; approved: number; rejected: number };
  unread_messages: number;
  gallery_count: number;
}
