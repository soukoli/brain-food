import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainFood",
  description: "Organize your tasks into projects and track your daily progress",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BrainFood",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('brainfood-theme') || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 2500,
                classNames: {
                  toast: "rounded-xl shadow-lg border-none",
                  success: "bg-success text-white",
                  error: "bg-error text-white",
                },
                style: {
                  padding: "12px 16px",
                  fontSize: "14px",
                },
              }}
              containerAriaLabel="Notifications"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
