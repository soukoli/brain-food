"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Folder, Target, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/projects", label: "Projects", Icon: Folder },
  { href: "/focus", label: "Focus", Icon: Target },
  { href: "/capture", label: "Capture", Icon: Plus },
] as const;

export function AppTabbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t bg-white dark:bg-slate-950 safe-area-inset-bottom">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.Icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center min-h-[44px] transition-colors",
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <IconComponent className="h-6 w-6" />
            <span className="mt-1 text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
