'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AdminStats, AdminVendorDetail, AdminVendorSummary, PaginatedMeta, VendorStatus } from '@/lib/types';

interface StatsResponse {
  data: AdminStats;
}

interface VendorsResponse {
  data: AdminVendorSummary[];
  meta?: PaginatedMeta;
}

interface VendorResponse {
  data: AdminVendorDetail;
}

function buildVendorQuery(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
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
