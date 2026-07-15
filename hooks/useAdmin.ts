'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  AdminMarketplaceUserDetail,
  AdminMarketplaceUserSummary,
  AdminOrderDetail,
  AdminOrderStats,
  AdminOrderSummary,
  AdminProductDetail,
  AdminProductSummary,
  AdminStats,
  AdminUserOrderSummary,
  AdminVendorProductSummary,
  AdminStatsChart,
  AdminVendorDetail,
  AdminVendorSummary,
  Category,
  PaginatedMeta,
  VendorStatus,
} from '@/lib/types';

interface StatsResponse {
  data: AdminStats;
}

interface StatsChartResponse {
  data: AdminStatsChart;
}

interface VendorsResponse {
  data: AdminVendorSummary[];
  meta?: PaginatedMeta;
}

interface VendorResponse {
  data: AdminVendorDetail;
}

interface ProductsResponse {
  data: AdminProductSummary[];
  meta: PaginatedMeta;
}

interface ProductResponse {
  data: AdminProductSummary;
}

interface AdminProductDetailResponse {
  data: AdminProductDetail;
}

interface CategoriesResponse {
  data: Category[];
}

function buildVendorQuery(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  return query.toString();
}

function buildProductQuery(params?: { status?: string; search?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  query.set('limit', String(params?.limit ?? 50));
  return query.toString();
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<StatsResponse>('/api/admin/stats'),
    retry: 0,
  });
}

export function useAdminVendors(params?: { status?: string; search?: string }) {
  const qs = buildVendorQuery(params);
  return useQuery({
    queryKey: ['admin', 'vendors', params],
    queryFn: () => api.get<VendorsResponse>(`/api/admin/vendors${qs ? `?${qs}` : ''}`),
    retry: 0,
  });
}

export function useAdminVendor(vendorId: string) {
  return useQuery({
    queryKey: ['admin', 'vendors', vendorId],
    queryFn: () => api.get<VendorResponse>(`/api/admin/vendors/${vendorId}`),
    enabled: Boolean(vendorId),
    retry: 0,
  });
}

export function useAdminVendorStatusAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, status, reason }: { vendorId: string; status: VendorStatus; reason?: string }) =>
      api.patch<{ data: AdminVendorSummary }>(`/api/admin/vendors/${vendorId}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useAdminProducts(params?: { status?: string; search?: string }) {
  const qs = buildProductQuery(params);
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => api.get<ProductsResponse>(`/api/admin/products?${qs}`),
    retry: 0,
  });
}

export function useAdminProduct(productId: string) {
  return useQuery({
    queryKey: ['admin', 'products', productId],
    queryFn: () => api.get<AdminProductDetailResponse>(`/api/admin/products/${productId}`),
    enabled: Boolean(productId),
    retry: 0,
  });
}

export function useAdminProductApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.patch<ProductResponse>(`/api/admin/products/${productId}/approve`),
    onSuccess: (_data, productId) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products', productId] });
    },
  });
}

export function useAdminProductReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason: string }) =>
      api.patch<ProductResponse>(`/api/admin/products/${productId}/reject`, { reason }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products', productId] });
    },
  });
}

export function useAdminProductArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, reason }: { productId: string; reason?: string }) =>
      api.patch<ProductResponse>(`/api/admin/products/${productId}/archive`, { reason }),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products', productId] });
    },
  });
}

export function useAdminProductDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<{ data: { message: string } }>(`/api/admin/products/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get<CategoriesResponse>('/api/store/categories'),
    retry: 0,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      slug?: string;
      parent_id?: string | null;
      column_group?: string | null;
      image_url?: string | null;
      position?: number;
    }) => api.post<{ data: Category }>('/api/admin/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      slug?: string;
      column_group?: string | null;
      image_url?: string | null;
      position?: number;
    }) => api.patch<{ data: Category }>(`/api/admin/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { message: string } }>(`/api/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
}

export function useRevalidateCategories() {
  return useMutation({
    mutationFn: () => api.post<{ data: { message: string } }>('/api/admin/categories/revalidate'),
  });
}

export function useAdminStatsChart() {
  return useQuery({
    queryKey: ['admin', 'stats', 'chart'],
    queryFn: () => api.get<StatsChartResponse>('/api/admin/stats/chart'),
    retry: 0,
  });
}

interface UsersListResponse {
  data: AdminMarketplaceUserSummary[];
  meta: PaginatedMeta;
}

interface UserDetailResponse {
  data: AdminMarketplaceUserDetail;
}

interface UserOrdersResponse {
  data: AdminUserOrderSummary[];
  meta: PaginatedMeta;
}

interface VendorProductsResponse {
  data: AdminVendorProductSummary[];
  meta: PaginatedMeta;
}

export interface AdminUsersQueryParams {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function buildUsersQuery(params?: AdminUsersQueryParams): string {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  query.set('limit', String(params?.limit ?? 25));
  return query.toString();
}

export function useAdminUsers(params?: AdminUsersQueryParams) {
  const qs = buildUsersQuery(params);
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.get<UsersListResponse>(`/api/admin/users?${qs}`),
    retry: 0,
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => api.get<UserDetailResponse>(`/api/admin/users/${userId}`),
    enabled: Boolean(userId),
    retry: 0,
  });
}

export function useAdminUserOrders(userId: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'orders', page],
    queryFn: () =>
      api.get<UserOrdersResponse>(`/api/admin/users/${userId}/orders?page=${page}&limit=10`),
    enabled: Boolean(userId),
    retry: 0,
  });
}

export function useAdminVendorProducts(vendorId: string | null, page = 1) {
  return useQuery({
    queryKey: ['admin', 'vendors', vendorId, 'products', page],
    queryFn: () =>
      api.get<VendorProductsResponse>(
        `/api/admin/vendors/${vendorId}/products?page=${page}&limit=10`,
      ),
    enabled: Boolean(vendorId),
    retry: 0,
  });
}

export function useAdminUserSuspend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.patch<{ data: AdminMarketplaceUserSummary }>(`/api/admin/users/${userId}/suspend`, {
        reason,
      }),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

export function useAdminUserActivate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.patch<{ data: AdminMarketplaceUserSummary }>(`/api/admin/users/${userId}/activate`),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
}

interface AdminOrdersResponse {
  data: AdminOrderSummary[];
  meta: PaginatedMeta;
}

interface AdminOrderResponse {
  data: AdminOrderDetail;
}

interface AdminOrderStatsResponse {
  data: AdminOrderStats;
}

export interface AdminOrdersQueryParams {
  status?: string;
  vendor_id?: string;
  buyer_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

function buildOrdersQuery(params?: AdminOrdersQueryParams): string {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.vendor_id) query.set('vendor_id', params.vendor_id);
  if (params?.buyer_id) query.set('buyer_id', params.buyer_id);
  if (params?.search) query.set('search', params.search);
  if (params?.date_from) query.set('date_from', params.date_from);
  if (params?.date_to) query.set('date_to', params.date_to);
  if (params?.page) query.set('page', String(params.page));
  query.set('limit', String(params?.limit ?? 25));
  return query.toString();
}

export function useAdminOrderStats() {
  return useQuery({
    queryKey: ['admin', 'orders', 'stats'],
    queryFn: () => api.get<AdminOrderStatsResponse>('/api/admin/orders/stats'),
    retry: 0,
  });
}

export function useAdminOrders(params?: AdminOrdersQueryParams) {
  const qs = buildOrdersQuery(params);
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => api.get<AdminOrdersResponse>(`/api/admin/orders?${qs}`),
    retry: 0,
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => api.get<AdminOrderResponse>(`/api/admin/orders/${orderId}`),
    enabled: Boolean(orderId),
    retry: 0,
  });
}

export function useAdminOrderCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.patch<{ data: AdminOrderSummary }>(`/api/admin/orders/${orderId}/cancel`, { reason }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders', 'stats'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}
