"use client";

import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveLayout>
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
      <ScrollToTop />
    </ResponsiveLayout>
  );
}

function PageLoadingFallback() {
  return (
    <div className="animate-pulse px-4 pt-14 space-y-4">
      <div className="h-8 w-32 bg-border rounded" />
      <div className="h-32 bg-border rounded-lg" />
      <div className="h-24 bg-border rounded-lg" />
    </div>
  );
}
