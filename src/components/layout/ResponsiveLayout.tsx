"use client";

import { AppTabbar } from "@/components/layout/AppTabbar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-muted">
        <DesktopSidebar />
        {/* Main content area with rounded corners */}
        <main className="ml-16 min-h-screen p-4">
          <div className="bg-background rounded-2xl min-h-[calc(100vh-2rem)] shadow-sm">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="page-content">{children}</div>
      <AppTabbar />
    </div>
  );
}
