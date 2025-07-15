import { Button } from "@/components/ui/button";
import { RefreshCw, Package } from "lucide-react";

interface ErrorBannerProps {
  error: string;
  onRefresh: () => void;
}

export function ErrorBanner({ error, onRefresh }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-red-500" />
        <span className="text-red-700">{error}</span>
      </div>
      <Button
        onClick={onRefresh}
        size="sm"
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Coba Lagi
      </Button>
    </div>
  );
}
