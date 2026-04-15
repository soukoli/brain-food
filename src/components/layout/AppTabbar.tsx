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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom pointer-events-none">
      <nav className="bg-primary-dark rounded-xl shadow-elevated pointer-events-auto">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const IconComponent = item.Icon;
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-all duration-200",
                  isActive ? "text-info" : "text-text-muted hover:text-slate-300"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    isActive && "bg-white/10"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
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
