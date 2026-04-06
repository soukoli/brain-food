"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  right?: React.ReactNode;
  large?: boolean;
  transparent?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  right,
  large = false,
  transparent = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b",
        transparent
          ? "bg-transparent border-transparent"
          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 -ml-2 p-2 min-h-touch min-w-touch"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "font-semibold text-slate-900 dark:text-slate-50 truncate",
              large ? "text-2xl" : "text-lg"
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </header>
  );
}
