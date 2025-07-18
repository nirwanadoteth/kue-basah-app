"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Database,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useProductStore } from "@/lib/stores/product-store";

export function DatabaseSetupBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const { needsSetup, fetchProducts } = useProductStore();

  const performDatabaseCheck = useCallback(async () => {
    const hasBeenChecked = sessionStorage.getItem("db_check_complete");

    if (hasBeenChecked) {
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      await fetchProducts();
      setIsVisible(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      sessionStorage.setItem("db_check_complete", "true");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      const isSetupError =
        errorMessage.includes("Database tables not found") ||
        errorMessage.includes('relation "public.products" does not exist') ||
        errorMessage.includes("JWT");

      setIsVisible(isSetupError);
    } finally {
      setIsChecking(false);
    }
  }, [fetchProducts]);

  useEffect(() => {
    performDatabaseCheck();
  }, [performDatabaseCheck]);

  const handleRunSetup = () => {
    window.open("/scripts/combined-database-setup.sql", "_blank");
  };

  const handleRetry = async () => {
    await performDatabaseCheck();
  };

  if (isChecking) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700">Memeriksa koneksi database...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible && !needsSetup && showSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-700">
              Database terhubung dan siap digunakan
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Setup Database Diperlukan
            </h3>
            <p className="text-yellow-700 mb-4">
              Database Supabase belum dikonfigurasi. Ikuti langkah-langkah
              berikut untuk setup:
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  1
                </span>
                Pastikan environment variables Supabase sudah dikonfigurasi di
                .env.local
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  2
                </span>
                Jalankan script SQL untuk membuat tabel dan fungsi
              </div>
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  3
                </span>
                Refresh halaman setelah setup selesai
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRunSetup}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Lihat Script SQL
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>

              <Button
                onClick={handleRetry}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
                size="sm"
                disabled={isChecking}
              >
                {isChecking ? "Memeriksa..." : "Coba Lagi"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
