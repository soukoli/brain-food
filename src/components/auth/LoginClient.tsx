"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, FlaskConical } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginClient({ showTestLogin = false }: { showTestLogin?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setIsLoading(false);
    }
  };

  const handleTestSignIn = async () => {
    setIsTestLoading(true);
    try {
      await signIn("credentials", {
        email: "test@example.com",
        callbackUrl: "/",
      });
    } catch {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">BrainFood</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Organize your ideas, track your progress
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Capture ideas quickly</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Organize into projects</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Track your daily focus</span>
          </div>
        </div>

        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          size="lg"
          className="w-full h-14 text-base gap-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-50 dark:border-slate-700"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
          {isLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        {/* Dev Test Login */}
        {showTestLogin && (
          <Button
            onClick={handleTestSignIn}
            disabled={isTestLoading}
            size="lg"
            variant="outline"
            className="w-full h-12 text-base gap-3"
          >
            {isTestLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FlaskConical className="w-5 h-5" />
            )}
            {isTestLoading ? "Signing in..." : "Test Account (Dev Only)"}
          </Button>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 px-4">
          By signing in, you agree to our Terms of Service and Privacy Policy. Your data is private
          and secure.
        </p>
      </div>
    </div>
  );
}
