import type { Metadata } from 'next';
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/context/CartContext';
import { PaymentProvider } from '@/context/PaymentContext';
import { NotificationProvider } from '@/context/NotificationContext';
import FloatingQuoteCartWidget from '@/components/features/quotations/FloatingQuoteCartWidget';
import { Navbar } from '@/components/layout/Navbar';
import { CommandMenu } from '@/components/layout/CommandMenu';
import { Toaster } from 'sonner';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';
import { CSPostHogProvider } from '@infrastructure/analytics/posthog-provider';

import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Deshabilitar Static Generation en todo el árbol debido a Auth de Edge conflictivos con Vercel Functions
export const dynamic = 'force-dynamic';
// Retornar explícitamente a Node JS runtime global as an escape hatch para los fetch failed timeout
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: {
    default: "Liquidar.cl — Subastas B2B de Liquidación de Stock",
    template: "%s | Liquidar.cl Platform"
  },
  description: "Plataforma B2B líder en Chile para la comercialización de stock paletizado e individual mediante subastas y precio fijo.",
  keywords: ["subastas", "liquidación", "lotes", "pallets", "retailers", "Chile", "B2B", "Liquidar.cl"],
  authors: [{ name: "Liquidar.cl" }],
  creator: "Liquidar.cl",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://liquidar-ai-chile-lk6mrv8n5-esteban-dev.vercel.app",
    title: "Liquidar.cl — Plataforma de Subastas B2B",
    description: "Comercialización de stock paletizado e individual de grandes retailers en Chile.",
    siteName: "Liquidar.cl",
  },
  icons: {
    icon: "/logo-liquidar.png",
    shortcut: "/logo-liquidar.png",
    apple: "/logo-liquidar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CSPostHogProvider>
            <CartProvider>
              <PaymentProvider>
                <NotificationProvider>
                  <Navbar />
                  {children}
                  <FloatingQuoteCartWidget />
                  <WhatsAppButton />
                  <Toaster />
                  <CommandMenu />
                </NotificationProvider>
              </PaymentProvider>
            </CartProvider>
          </CSPostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
