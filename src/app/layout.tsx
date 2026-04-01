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
    default: "Dropservice Platform — Gestión de Servicios",
    template: "%s | Dropservice Platform"
  },
  description: "Plataforma SaaS de Dropservice para gestionar cotizaciones, proveedores y pedidos de manera eficiente.",
  keywords: ["dropservice", "servicios", "cotizaciones", "proveedores", "eventos", "gestión"],
  authors: [{ name: "EventHub Utils" }],
  creator: "EventHub Utils",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://dropservice.vercel.app",
    title: "Dropservice Platform — Gestión Inteligente",
    description: "La solución integral para administrar tu negocio de servicios. Cotiza, asigna y entrega.",
    siteName: "Dropservice Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dropservice Platform",
    description: "Gestión eficiente de servicios y proveedores.",
    creator: "@eventhub",
  },
  icons: {
    icon: "/favicon.ico",
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
