"use client";

import { AppTabbar } from "@/components/layout/AppTabbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      {children}
      <AppTabbar />
    </div>
  );
}
