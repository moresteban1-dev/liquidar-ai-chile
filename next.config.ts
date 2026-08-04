import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env['ANALYZE'] === 'true',
});

const config: NextConfig = {
  reactStrictMode: true,

  // Inyectar variables públicas de Supabase en el bundle de Next.js para Vercel
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },

  // Next.js 16/15 compatibility: Merge external packages
  serverExternalPackages: [
    '@google/generative-ai',
    'pino',
    '@opentelemetry/api',
    '@opentelemetry/sdk-trace-node',
    'jspdf',
    'fflate',
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    'bullmq',
    'ioredis',
    'sharp',
    'canvas',
  ],

  // Next.js 16: Explicitly set empty turbopack config to allow fallback to Webpack
  // when custom webpack properties are defined (e.g. by plugins).
  // @ts-ignore
  turbopack: {
    rules: {}
  },

  // Configuración de Webpack (Preservada del antiguo next.config.mjs)
  webpack: (config, { isServer }) => {
    // Ignorar warnings de dependencias opcionales
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /opentelemetry/ },
      { module: /genkit/ },
      { module: /bullmq/ },
      { message: /Critical dependency/ },
      { message: /Serializing big strings/ },
    ];

    // Fallbacks para módulos de Node.js en cliente
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            dns: false,
            child_process: false,
            crypto: false,
        };
    }

    return config;
  },

  experimental: {
    // Server Actions config
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        '*.vercel.app',
        'liquidar-ai-chile.vercel.app',
        'liquidar.cl',
        'www.liquidar.cl',
        'localhost:3000',
      ],
    },
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

  // Headers de seguridad con CSP dinámico
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: buildCSP() },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Var de entorno forzadas (Next.js config style)
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
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
