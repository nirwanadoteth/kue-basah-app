import type React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-pink-100 to-purple-100",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
