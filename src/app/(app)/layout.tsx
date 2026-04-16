"use client";

import { AppTabbar } from "@/components/layout/AppTabbar";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Suspense fallback={<PageLoadingFallback />}>
        <div className="page-content">{children}</div>
      </Suspense>
      <AppTabbar />
    </div>
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
