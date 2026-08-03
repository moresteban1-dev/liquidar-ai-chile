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


export const metadata: Metadata = {
  metadataBase: new URL("https://liquidar-ai-chile.vercel.app"),
  title: {
    default: "Liquidar.cl | Plataforma Oficial B2B de Subastas de Inventario y Liquidador Chile",
    template: "%s | Liquidar.cl Chile"
  },
  description: "Plataforma B2B líder en Chile para la compraventa y subastas de lotes al por mayor, retornos de retail, inventario excedente y liquidaciones corporativas con custodia Escrow segura.",
  keywords: ["subastas", "liquidación", "lotes", "pallets", "retailers", "Chile", "B2B", "Liquidar.cl"],
  authors: [{ name: "Liquidar.cl" }],
  creator: "Liquidar.cl",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://liquidar-ai-chile.vercel.app",
    title: "Liquidar.cl | B2B Subastas y Liquidaciones Corporativas Chile",
    description: "Transforme su inventario excedente en efectivo. Subastas transparentes B2B de retornos, tecnología y marcas en Chile.",
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
