import type { NextConfig } from 'next';
import { validateEnv } from './src/config/env.config';

// Valida el entorno en tiempo de arranque/build (Impide caídas silenciosas)
validateEnv();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env['ANALYZE'] === 'true',
});

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Next.js 16: Silence Turbopack error to allow Webpack plugins (Bundle Analyzer)
  // @ts-ignore - turbopack is a new key in Next 16
  turbopack: {},
  
  // Configuración de rutas tipadas (Next.js 15+ compatible)
  // typedRoutes: true,

  // Optimización de paquetes externos (Server-only)
  serverExternalPackages: [
    '@google/generative-ai',
    'pino',
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-node',
    'jspdf',
    'fflate'
  ],



  experimental: {
    // Server Actions config
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['dropservice-platform.vercel.app', 'localhost:3000'],
    },
    // Next.js 15 experimental features
    ppr: false,
    // Stale Times (Cache Client-side)
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true
    }
  },

  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: buildCSP(),
          },
        ],
      },
      {
        // Assets estáticos — caché agresivo
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

function buildCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${process.env['NEXT_PUBLIC_SUPABASE_URL'] || ''} https://*.pinecone.io https://generativelanguage.googleapis.com https://vitals.vercel-insights.com`,
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

export default withBundleAnalyzer(config);
