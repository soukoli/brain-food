"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Target, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/projects", label: "Projects", Icon: Folder },
  { href: "/focus", label: "Focus", Icon: Target },
  { href: "/capture", label: "Capture", Icon: Plus },
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
          "bg-primary-dark rounded-xl shadow-elevated pointer-events-auto transition-opacity duration-150",
          isPending && "opacity-90"
        )}
      >
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.Icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavigation(item.href, e)}
                onMouseEnter={() => handlePrefetch(item.href)}
                onTouchStart={() => handlePrefetch(item.href)}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-full transition-all duration-150",
                  "active:scale-95 touch-manipulation",
                  isActive ? "text-info" : "text-text-muted hover:text-slate-300"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150",
                    isActive && "bg-white/15 shadow-sm"
                  )}
                >
                  <IconComponent
                    className={cn("w-5 h-5 transition-all duration-150", isActive && "scale-110")}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
