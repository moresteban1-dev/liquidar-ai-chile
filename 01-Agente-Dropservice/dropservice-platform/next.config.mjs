// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Excluir módulos pesados del bundle de Edge
  // En Next.js 15, serverComponentsExternalPackages se mueve a la raíz como serverExternalPackages
  serverExternalPackages: [
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    'bullmq',
    'ioredis',
    'sharp',
    'canvas',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de webpack
  webpack: (config, { isServer }) => {
    // Ignorar warnings de dependencias opcionales
    config.ignoreWarnings = [
      { module: /opentelemetry/ },
      { module: /genkit/ },
      { module: /bullmq/ },
      { message: /Critical dependency/ },
    ];

    // Optimizaciones para servidor
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@genkit-ai/core': '@genkit-ai/core',
        '@genkit-ai/googleai': '@genkit-ai/googleai',
        'bullmq': 'bullmq',
        'ioredis': 'ioredis',
      });
    }

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
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Desactivar telemetría
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
};

export default nextConfig;
