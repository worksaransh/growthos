"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useDashboardMetrics(startDate: string, endDate: string, compare = false) {
  return useQuery({
    queryKey: ["dashboard", "metrics", startDate, endDate, compare],
    queryFn: () => api.getDashboardMetrics(startDate, endDate, compare),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useRevenueTrends(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["dashboard", "trends", "revenue", startDate, endDate],
    queryFn: () => api.getRevenueTrends(startDate, endDate),
    staleTime: 60_000,
  });
}

export function useSpendTrends(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["dashboard", "trends", "spend", startDate, endDate],
    queryFn: () => api.getSpendTrends(startDate, endDate),
    staleTime: 60_000,
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.getIntegrations(),
    staleTime: 30_000,
  });
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync", "status"],
    queryFn: () => api.getSyncStatus(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "orders", limit],
    queryFn: () => api.getRecentOrders(limit),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
