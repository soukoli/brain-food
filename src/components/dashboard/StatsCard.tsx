"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary-light",
  trend,
}: StatsCardProps) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          iconBgColor
        )}
      >
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted font-medium">{title}</p>
        <p className="text-xl font-bold text-text-primary mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        {trend && (
          <p
            className={cn(
              "text-xs font-medium mt-1",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)} {trend.label}
          </p>
        )}
      </div>
    </Card>
  );
}
