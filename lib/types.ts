export type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
}

export interface LoginResponse {
  data: {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  data: AdminUser;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  orders_today: number;
  revenue_today: number;
  pending_vendors: number;
  active_users: number;
  revenue_30d: { date: string; amount: number }[];
  orders_by_status: { status: string; count: number }[];
  recent_vendors: AdminVendorSummary[];
}

export interface AdminVendorSummary {
  id: string;
  shop_name: string;
  email: string;
  region?: string | null;
  products_count?: number;
  orders_count?: number;
  rating?: number | null;
  status: VendorStatus;
  created_at?: string;
  logo_url?: string | null;
}

export interface AdminVendorDetail extends AdminVendorSummary {
  owner_name?: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  products?: Array<{ id: string; title: string; status: string; price: number; image?: string | null }>;
  orders?: Array<{ id: string; status: string; total_amount: number; created_at: string }>;
  actions_history?: Array<{ id: string; action: string; note?: string | null; created_at: string }>;
}

export type ProductStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'SOLD'
  | 'ARCHIVED'
  | 'REJECTED';

export interface AdminProductSummary {
  id: string;
  vendor_id: string;
  title: string;
  price: number;
  status: ProductStatus;
  stock: number;
  views_count: number;
  created_at: string;
  updated_at?: string;
  primary_image: string | null;
  shop_name?: string | null;
  category_name?: string | null;
  brand?: string | null;
  description?: string | null;
  condition?: string | null;
  material?: string | null;
  color?: string | null;
  size?: string | null;
  category_id?: string | null;
}

export interface AdminProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  is_primary: boolean;
}

export interface AdminProductVendorInfo {
  shop_name: string;
  email: string;
  status: VendorStatus;
}

export interface AdminProductDetail extends AdminProductSummary {
  images: AdminProductImage[];
  orders_count: number;
  vendor: AdminProductVendorInfo;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  column_group: string | null;
  image_url: string | null;
  position: number;
  created_at?: string;
  updated_at?: string;
  children?: Category[];
}

export interface AdminStatsChart {
  funnel: Array<{ label: string; value: number; conversion_rate: number | null }>;
  top_products: Array<{
    id: string;
    title: string;
    views_count: number;
    shop_name: string | null;
    orders_count: number;
  }>;
  cart_abandonment: Array<{
    date: string;
    carts: number;
    orders: number;
    abandonment_rate: number;
  }>;
}
