import { TableSkeleton } from "@/components/loading-skeleton";

export function InventoryLoadingFallback() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-64 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
      </div>
      <TableSkeleton />
    </div>
  );
}
