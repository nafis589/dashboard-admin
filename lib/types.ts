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

export type MarketplaceUserRole = 'BUYER' | 'VENDOR';
export type MarketplaceUserStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminMarketplaceUserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: MarketplaceUserRole;
  status: MarketplaceUserStatus;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
  vendor_id: string | null;
  orders_count: number;
  active_products_count: number;
}

export interface AdminUserActionHistory {
  id: string;
  action: string;
  reason: string | null;
  admin_name: string;
  admin_email: string;
  created_at: string;
}

export interface AdminMarketplaceUserDetail extends AdminMarketplaceUserSummary {
  shop_name: string | null;
  vendor_orders_count: number;
  vendor_revenue: number;
  actions_history: AdminUserActionHistory[];
}

export interface AdminUserOrderSummary {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export interface AdminVendorProductSummary {
  id: string;
  title: string;
  status: string;
  price: number;
  views_count: number;
  image: string | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';

export interface AdminOrderSummary {
  id: string;
  buyer_id: string;
  vendor_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_fee: number;
  payment_method: PaymentMethod;
  buyer_name: string;
  shop_name: string;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderStats {
  orders_today: number;
  revenue_today: number;
  pending_processing: number;
  delivery_rate: number;
}

export interface AdminOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  offer_id: string | null;
  original_price: number | null;
  product_snapshot: {
    title: string;
    image: string | null;
    brand: string | null;
  };
  product_status: string | null;
}

export interface AdminOrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_by: string;
  created_at: string;
  author_name: string;
  author_role: 'Acheteur' | 'Vendeur' | 'Admin';
}

export interface AdminOrderDetail extends AdminOrderSummary {
  shipping_address: {
    first_name: string;
    last_name: string;
    phone: string;
    notes?: string | null;
    latitude: number;
    longitude: number;
    region_id: string;
    address_label?: string | null;
  };
  shipping_region_id: string;
  shipping_method: 'PER_KM' | 'FIXED';
  shipping_distance_km: number | null;
  tracking_number: string | null;
  items: AdminOrderItem[];
  status_history: AdminOrderStatusHistoryEntry[];
  vendor: {
    id: string;
    shop_name: string;
    email: string;
  };
  buyer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}
