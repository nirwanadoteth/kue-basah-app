import { Button } from "@/components/ui/button";
import { AddProductModal } from "@/components/add-product-modal";
import { Package, Plus } from "lucide-react";

interface EmptyProductTableProps {
  searchTerm: string;
}

export function EmptyProductTable({ searchTerm }: EmptyProductTableProps) {
  return (
    <td colSpan={5} className="py-12 text-center text-gray-500">
      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      {searchTerm ? (
        <div>
          <p className="mb-4">
            Tidak ada produk yang ditemukan untuk &quot;{searchTerm}&quot;
          </p>
          <AddProductModal
            trigger={
              <Button className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk Baru
              </Button>
            }
          />
        </div>
      ) : (
        <div>
          <p className="mb-4">Belum ada produk. Tambahkan produk pertama Anda!</p>
          <AddProductModal
            trigger={
              <Button className="cotton-candy-button from-green-400 to-emerald-400 rounded-full px-6">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk Pertama
              </Button>
            }
          />
        </div>
      )}
    </td>
  );
}
