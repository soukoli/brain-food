"use client";

import { PROJECT_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            value === color.value && "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-50"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {value === color.value && <Check className="w-5 h-5 text-white" />}
        </button>
      ))}
    </div>
  );
}
