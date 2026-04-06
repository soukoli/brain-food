import { cn } from "@/lib/utils";

interface BlockProps {
  children: React.ReactNode;
  className?: string;
}

export function Block({ children, className }: BlockProps) {
  return <div className={cn("px-4 py-2", className)}>{children}</div>;
}

interface BlockTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function BlockTitle({ children, className }: BlockTitleProps) {
  return (
    <h2
      className={cn(
        "px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide",
        className
      )}
    >
      {children}
    </h2>
  );
}
