"use client";

interface KonstaProviderProps {
  children: React.ReactNode;
}

// Simplified provider - Konsta UI has compatibility issues with Tailwind CSS v4
// Using shadcn/ui components instead
export function KonstaProvider({ children }: KonstaProviderProps) {
  return <>{children}</>;
}
