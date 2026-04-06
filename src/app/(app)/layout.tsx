"use client";

import { AppTabbar } from "@/components/layout/AppTabbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <AppTabbar />
    </div>
  );
}
