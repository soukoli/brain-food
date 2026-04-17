"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Crosshair, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/projects", label: "Projects", Icon: Calendar },
  { href: "/focus", label: "Focus", Icon: Crosshair },
  { href: "/capture", label: "Capture", Icon: Plus, isMain: true },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function AppTabbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Optimistic navigation with prefetch
  const handleNavigation = useCallback(
    (href: string, e: React.MouseEvent) => {
      e.preventDefault();

      // Instant visual feedback - the active state will update immediately
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  // Prefetch on hover/touch for faster navigation
  const handlePrefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom pointer-events-none">
      <nav
        className={cn(
          "bg-surface rounded-2xl shadow-elevated pointer-events-auto transition-opacity duration-150 border border-border",
          isPending && "opacity-90"
        )}
      >
        <div className="flex items-center justify-around h-14">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.Icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const isMainButton = "isMain" in item && item.isMain;

            if (isMainButton) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  onMouseEnter={() => handlePrefetch(item.href)}
                  onTouchStart={() => handlePrefetch(item.href)}
                  prefetch={true}
                  className="flex items-center justify-center -mt-4 touch-manipulation active:scale-95"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-elevated">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavigation(item.href, e)}
                onMouseEnter={() => handlePrefetch(item.href)}
                onTouchStart={() => handlePrefetch(item.href)}
                prefetch={true}
                className={cn(
                  "flex items-center justify-center w-12 h-12 transition-all duration-150",
                  "active:scale-95 touch-manipulation",
                  isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
                )}
              >
                <IconComponent
                  className={cn(
                    "w-6 h-6 transition-all duration-150",
                    isActive && "stroke-[2.5px]"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
