import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Sentinel Security: Although wildcard is currently needed for flexibility,
    // this should be locked down to specific domains (e.g., supabase.co) in production
    // to prevent exfiltration via image rendering.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            // Default CSP, can be overridden by middleware or specific pages if needed.
            // Allows 'unsafe-inline' and 'unsafe-eval' for now to prevent breaking Next.js/React hydration,
            // but effectively blocks object/base-uri.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co https://api.stripe.com;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
