// React Query hooks for API calls (Web)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, invoicesApi, rewardsApi, eventsApi } from '@stannel/api-client';

// Wallet hooks
export function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance(),
  });
}

export function useWalletCard() {
  return useQuery({
    queryKey: ['wallet', 'card'],
    queryFn: () => walletApi.getCard(),
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
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: () => invoicesApi.getStats(),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesApi.getById(id),
    enabled: !!id,
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
    mutationFn: (productId: string) => rewardsApi.redeem(productId),
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
    onSuccess: () => {
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
