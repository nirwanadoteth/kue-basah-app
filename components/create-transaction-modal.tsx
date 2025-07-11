"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { TransactionsAPI } from "@/lib/api/transactions";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface CreateTransactionModalProps {
  trigger: React.ReactNode;
  onTransactionCreated: (transactionId: number) => void;
  isOrder?: boolean;
}

export function CreateTransactionModal({
  trigger,
  onTransactionCreated,
  isOrder = false,
}: CreateTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Anda harus login untuk membuat transaksi");
      return;
    }

    setIsLoading(true);

    try {
      const newTransaction = await TransactionsAPI.create({
        user_id: user.user_id,
      });

      setOpen(false);
      toast.success("Transaksi baru berhasil dibuat!");
      onTransactionCreated(newTransaction.id);
    } catch (error) {
      console.error("Error creating transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat transaksi";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md cotton-candy-card border-pink-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            {isOrder ? "Buat Pesanan Baru" : "Buat Transaksi Cepat"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Admin: {user?.username}</p>
              <p className="text-xs text-blue-600 mt-1">
                {isOrder
                  ? "Pesanan akan dicatat atas nama Anda sebagai admin."
                  : "Transaksi cepat akan dicatat atas nama Anda."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-pink-200 hover:bg-pink-50"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 cotton-candy-button from-green-400 to-emerald-400"
              disabled={isLoading}
            >
              {isLoading
                ? "Membuat..."
                : isOrder
                ? "Buat Pesanan"
                : "Buat Transaksi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
