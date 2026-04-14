// React Query hooks for API calls (Web)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, invoicesApi, rewardsApi, eventsApi, aiApi, notificationsApi, goalsApi, serviceProvidersApi, analyticsApi, adminApi, supplierApi, suppliersDirectoryApi, getAuthToken } from '@stannel/api-client';
import type { ChatMessage } from '@stannel/types';

// Check if user is authenticated
const isAuthenticated = () => !!getAuthToken();

// Wallet hooks
export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance(),
    enabled: isAuthenticated(),
  });
}

export function useWalletCard() {
  return useQuery({
    queryKey: ['wallet', 'card'],
    queryFn: () => walletApi.getCard(),
    enabled: isAuthenticated(),
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const response = await walletApi.getTransactions();
      return response.data;
    },
  });
}

// Invoice hooks
export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await invoicesApi.getAll();
      return response.data;
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: () => invoicesApi.getStats(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
  });
}

export function useSuppliers(enabled: boolean = true) {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => invoicesApi.getSuppliers(),
    enabled,
  });
}

export function useArchitectSuppliers(enabled: boolean = true) {
  return useQuery({
    queryKey: ['my-suppliers'],
    queryFn: () => invoicesApi.getMySuppliers(),
    enabled,
  });
}

export function useUploadInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => invoicesApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

// Rewards hooks
export function useRewardProducts() {
  return useQuery({
    queryKey: ['rewards', 'products'],
    queryFn: () => rewardsApi.getProducts(),
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, cashPayment = 0 }: { productId: string; cashPayment?: number }) =>
      rewardsApi.redeem({ productId, cashAmount: cashPayment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

// Events hooks
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getAll(),
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.register(eventId),
    // Optimistic update - show registration immediately
    onMutate: async (eventId: string) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previousEvents = queryClient.getQueryData(['events']);

      // Optimistically update the event
      queryClient.setQueryData(['events'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((event: any) =>
            event.id === eventId
              ? { ...event, registeredCount: (event.registeredCount || 0) + 1, isRegistered: true }
              : event
          ),
        };
      });

      return { previousEvents };
    },
    onError: (_err, _eventId, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events'], context.previousEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Dashboard stats hook
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [balance, card, invoicesResponse] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getCard(),
        invoicesApi.getAll(),
      ]);

      const invoices = invoicesResponse.data;

      const pendingInvoices = invoices.filter(
        (inv) => inv.status === 'PENDING_ADMIN' || inv.status === 'PENDING_SUPPLIER_PAY'
      ).length;

      const approvedThisMonth = invoices.filter((inv) => {
        if (inv.status !== 'APPROVED' && inv.status !== 'PAID') return false;
        if (!inv.approvedAt) return false;
        const approvedDate = new Date(inv.approvedAt);
        const now = new Date();
        return (
          approvedDate.getMonth() === now.getMonth() &&
          approvedDate.getFullYear() === now.getFullYear()
        );
      }).length;

      return {
        points: balance.points || 0,
        cash: balance.cash || 0,
        pendingInvoices,
        approvedThisMonth,
        cardNumber: card.cardNumber || '0000',
        rank: card.rank || 'BRONZE',
      };
    },
  });
}

// AI Chat hooks
export function useAiChat() {
  return useMutation({
    mutationFn: ({
      message,
      conversationHistory,
    }: {
      message: string;
      conversationHistory?: ChatMessage[];
    }) => aiApi.chat(message, conversationHistory),
  });
}

export function useAiPrompts() {
  return useQuery({
    queryKey: ['ai', 'prompts'],
    queryFn: () => aiApi.getPrompts(),
  });
}

// Notifications hooks
export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => notificationsApi.getAll({ unreadOnly }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    // Optimistic update - mark as read immediately for instant UI feedback
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications', { unreadOnly: false }]);

      // Optimistically update the cache
      queryClient.setQueryData(['notifications', { unreadOnly: false }], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => n.id === id ? { ...n, isRead: true } : n),
        };
      });

      // Decrease unread count
      queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
        if (typeof old?.count === 'number') return { count: Math.max(0, old.count - 1) };
        return old;
      });

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    // Optimistic update - mark all as read immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previousNotifications = queryClient.getQueryData(['notifications', { unreadOnly: false }]);

      // Optimistically mark all as read
      queryClient.setQueryData(['notifications', { unreadOnly: false }], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => ({ ...n, isRead: true })),
        };
      });

      // Set unread count to 0
      queryClient.setQueryData(['notifications', 'unread-count'], { count: 0 });

      // Clear unread-only query
      queryClient.setQueryData(['notifications', { unreadOnly: true }], { data: [] });

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', { unreadOnly: false }], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Goals hooks
export function useArchitectGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
    enabled: isAuthenticated(),
  });
}

export function useActiveGoal() {
  return useQuery({
    queryKey: ['goals', 'active'],
    queryFn: () => goalsApi.getActive(),
    enabled: isAuthenticated(),
  });
}

export function useGoalStats() {
  return useQuery({
    queryKey: ['goals', 'stats'],
    queryFn: () => goalsApi.getStats(),
    enabled: isAuthenticated(),
  });
}

export function useBonusTransactions() {
  return useQuery({
    queryKey: ['goals', 'bonuses'],
    queryFn: () => goalsApi.getBonuses(),
    enabled: isAuthenticated(),
  });
}

// Service Providers hooks
export function useServiceProviders(category?: string) {
  return useQuery({
    queryKey: ['service-providers', { category }],
    queryFn: () => serviceProvidersApi.getAll({ category }),
  });
}

export function useServiceProviderCategories() {
  return useQuery({
    queryKey: ['service-providers', 'categories'],
    queryFn: () => serviceProvidersApi.getCategories(),
  });
}

// Admin: Service Providers hooks
export function useAdminServiceProviders() {
  return useQuery({
    queryKey: ['admin', 'service-providers'],
    queryFn: () => serviceProvidersApi.admin.getAll(),
  });
}

export function useCreateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      phone?: string;
      email?: string;
      category: string;
      description?: string;
      website?: string;
      address?: string;
    }) => serviceProvidersApi.admin.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });
}

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{
      name: string;
      phone: string;
      email: string;
      category: string;
      description: string;
      website: string;
      address: string;
      isActive: boolean;
      isVerified: boolean;
    }> }) => serviceProvidersApi.admin.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });
}

export function useDeleteServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceProvidersApi.admin.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-providers'] });
      queryClient.invalidateQueries({ queryKey: ['service-providers'] });
    },
  });
}

// Admin: Goals hooks
export function useAdminGoals(activeOnly: boolean = false) {
  return useQuery({
    queryKey: ['admin', 'goals', { activeOnly }],
    queryFn: () => goalsApi.admin.getAll({ activeOnly }),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      architectId: string;
      targetAmount: number;
      bonusPercentage: number;
      periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      startDate: string;
      endDate: string;
    }) => goalsApi.admin.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Analytics hooks (Admin)
export function useAnalyticsTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ['analytics', 'trends', period],
    queryFn: () => analyticsApi.getTrends(period),
  });
}

export function useSlaReport() {
  return useQuery({
    queryKey: ['analytics', 'sla-report'],
    queryFn: () => analyticsApi.getSlaReport(),
  });
}

export function useTopArchitects() {
  return useQuery({
    queryKey: ['analytics', 'top-architects'],
    queryFn: () => analyticsApi.getTopArchitects(),
  });
}

export function useSupplierPerformance() {
  return useQuery({
    queryKey: ['analytics', 'supplier-performance'],
    queryFn: () => analyticsApi.getSupplierPerformance(),
  });
}

// Contracts hooks (Admin)
export function useContracts() {
  return useQuery({
    queryKey: ['admin', 'contracts'],
    queryFn: () => adminApi.getContracts(),
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      supplierId: string;
      type: 'STANDARD' | 'PREMIUM' | 'EXCLUSIVE';
      feePercent: number;
      validFrom: string;
      validTo: string;
    }) => adminApi.createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contracts'] });
    },
  });
}

// Audit Logs hooks (Admin)
export function useAuditLogs(page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', { page, pageSize }],
    queryFn: () => adminApi.getAuditLogs({ page, pageSize }),
  });
}

// Events hooks (Admin)
export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => eventsApi.admin.getAllEvents(),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      date: string;
      location: string;
      capacity: number;
      pointsCost?: number;
      imageUrl?: string;
    }) => eventsApi.admin.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{
      title: string;
      description: string;
      date: string;
      location: string;
      capacity: number;
      pointsCost: number;
      imageUrl: string;
      isHidden: boolean;
    }> }) => eventsApi.admin.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.admin.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Supplier hooks
export function useSupplierInvoices(status?: string) {
  return useQuery({
    queryKey: ['supplier', 'invoices', { status }],
    queryFn: () => supplierApi.getInvoices({ status }),
  });
}

export function useSupplierStats() {
  return useQuery({
    queryKey: ['supplier', 'stats'],
    queryFn: () => supplierApi.getStats(),
  });
}

export function useSupplierGoals() {
  return useQuery({
    queryKey: ['supplier', 'goals'],
    queryFn: () => supplierApi.getGoals(),
  });
}

export function useSupplierCatalog() {
  return useQuery({
    queryKey: ['supplier', 'catalog'],
    queryFn: () => supplierApi.getCatalog(),
  });
}

export function useUploadPaymentProof() {
  return useMutation({
    mutationFn: (file: File) => supplierApi.uploadPaymentProof(file),
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, reference, paymentProofUrl }: { invoiceId: string; reference: string; paymentProofUrl?: string }) =>
      supplierApi.confirmPayment(invoiceId, reference, paymentProofUrl),
    onSuccess: () => {
      // Force refetch all supplier-related queries
      queryClient.invalidateQueries({
        queryKey: ['supplier'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({
        queryKey: ['invoices'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({
        queryKey: ['admin'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({
        queryKey: ['wallet'],
        refetchType: 'all'
      });
    },
  });
}

export function useSupplierCommissionHistory() {
  return useQuery({
    queryKey: ['supplier', 'commissions'],
    queryFn: () => supplierApi.getCommissionHistory(),
  });
}

export function useSupplierPaymentHistory() {
  return useQuery({
    queryKey: ['supplier', 'payment-history'],
    queryFn: () => supplierApi.getPaymentHistory(),
  });
}

// Suppliers Directory hooks (for architects to browse suppliers)
export function useSuppliersDirectory(params?: { page?: number; pageSize?: number; search?: string }, enabled = true) {
  return useQuery({
    queryKey: ['suppliers-directory', params],
    queryFn: () => suppliersDirectoryApi.getAll(params),
    enabled,
  });
}

export function useSupplierDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: ['suppliers-directory', id],
    queryFn: () => suppliersDirectoryApi.getById(id),
    enabled: !!id && enabled,
  });
}

// Supplier Projects hooks
export function useSupplierProjects(supplierId: string, enabled = true) {
  return useQuery({
    queryKey: ['supplier-projects', supplierId],
    queryFn: async () => {
      const { config, getHeaders, fetchWithAuth } = await import('@stannel/api-client');
      const response = await fetchWithAuth(`${config.baseUrl}/projects/supplier/${supplierId}`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
    enabled: !!supplierId && enabled,
  });
}

export function useSupplierProject(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['supplier-project', projectId],
    queryFn: async () => {
      const { config, getHeaders, fetchWithAuth } = await import('@stannel/api-client');
      const response = await fetchWithAuth(`${config.baseUrl}/projects/${projectId}`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!projectId && enabled,
  });
}
