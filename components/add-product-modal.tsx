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
import { useInventoryStore } from "@/lib/store-supabase";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddProductModalProps {
  trigger: React.ReactNode;
}

export function AddProductModal({ trigger }: AddProductModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    currentStock: "",
    minStock: "20",
  });

  const { addProduct, isLoading } = useInventoryStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs with proper null checks
    if (!formData.name || !formData.name.trim()) {
      toast.error("Nama produk wajib diisi");
      return;
    }

    if (!formData.price || !formData.price.trim()) {
      toast.error("Harga wajib diisi");
      return;
    }

    if (!formData.currentStock || !formData.currentStock.trim()) {
      toast.error("Stok awal wajib diisi");
      return;
    }

    const price = Number.parseFloat(formData.price.trim());
    const currentStock = Number.parseInt(formData.currentStock.trim());
    const minStock = Number.parseInt(formData.minStock?.trim() || "20");

    if (isNaN(price) || price <= 0) {
      toast.error("Harga harus berupa angka yang valid dan lebih dari 0");
      return;
    }

    if (isNaN(currentStock) || currentStock < 0) {
      toast.error("Stok awal harus berupa angka yang valid dan tidak negatif");
      return;
    }

    if (isNaN(minStock) || minStock < 0) {
      toast.error(
        "Stok minimum harus berupa angka yang valid dan tidak negatif"
      );
      return;
    }

    try {
      await addProduct({
        name: formData.name.trim(),
        price,
        current_stock: currentStock,
        min_stock: minStock,
      });

      // Reset form
      setFormData({
        name: "",
        price: "",
        currentStock: "",
        minStock: "20",
      });
      setOpen(false);
      toast.success("Produk berhasil ditambahkan!");
    } catch (error) {
      console.error("Error adding product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menambahkan produk";
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md cotton-candy-card border-pink-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <Plus className="h-5 w-5 text-green-500" />
            Tambah Produk Baru
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Contoh: Kue Lapis Legit"
              className="border-pink-200 focus:border-pink-400"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Harga (Rp) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="100"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="5000"
              className="border-pink-200 focus:border-pink-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Stok Awal *</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) =>
                  handleInputChange("currentStock", e.target.value)
                }
                placeholder="50"
                className="border-pink-200 focus:border-pink-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Stok Minimum</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", e.target.value)}
                placeholder="20"
                className="border-pink-200 focus:border-pink-400"
              />
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
              {isLoading ? "Menyimpan..." : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
