import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Remove "output: export" for development with API routes
  // For Capacitor iOS build, we'll use a different approach
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
