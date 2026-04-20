"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, Crosshair, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/projects", label: "Projects", Icon: FolderKanban },
  { href: "/focus", label: "Focus", Icon: Crosshair },
  { href: "/capture", label: "Capture", Icon: Plus, isMain: true },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNavigation = useCallback(
    (href: string, e: React.MouseEvent) => {
      e.preventDefault();
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const handlePrefetch = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 w-16 bg-surface border-r border-border z-50",
        "flex flex-col items-center py-6 gap-2",
        "transition-opacity duration-150",
        isPending && "opacity-80"
      )}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-6">
        <span className="text-white font-bold text-lg">B</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1">
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
                prefetch={true}
                className="my-4"
                title={item.label}
              >
                <div className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center shadow-md transition-all hover:scale-105">
                  <IconComponent className="w-5 h-5 text-white" />
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
              prefetch={true}
              title={item.label}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                "hover:bg-background",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <IconComponent
                className={cn("w-5 h-5 transition-all duration-150", isActive && "stroke-[2.5px]")}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
