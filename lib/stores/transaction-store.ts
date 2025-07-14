"use client";

import { create } from "zustand";
import { TransactionsAPI } from "@/lib/api/transactions";
import type {
  TransactionWithDetails,
} from "@/lib/supabase";
import { toast } from "sonner";

interface TransactionStore {
  // State
  transactions: TransactionWithDetails[];
  isLoading: boolean;
  error: string | null;
  needsSetup: boolean;

  // Actions
  fetchTransactions: () => Promise<void>;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>()((set) => ({
  // Initial state
  transactions: [],
  isLoading: false,
  error: null,
  needsSetup: false,

  // Fetch data
  fetchTransactions: async () => {
    try {
      set({ isLoading: true, error: null, needsSetup: false });
      const transactions = await TransactionsAPI.getAll();
      set({ transactions, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch transactions";
      const isSetupError =
        errorMessage.includes("Database tables not found") ||
        errorMessage.includes(
          'relation "public.transactions" does not exist'
        );
      set({
        error: isSetupError ? "Database setup required" : errorMessage,
        isLoading: false,
        needsSetup: isSetupError,
      });
      if (!isSetupError) toast.error(errorMessage);
      throw error;
    }
  },

  // Utility
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setNeedsSetup: (needsSetup) => set({ needsSetup }),
  clearError: () => set({ error: null }),
}));
