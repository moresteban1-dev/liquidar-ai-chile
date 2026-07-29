import type { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';
import FeaturedLots from '@/components/landing/FeaturedLots';
import ProcessSteps from '@/components/landing/ProcessSteps';
import RetailersSection from '@/components/landing/RetailersSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactSection from '@/components/landing/ContactSection';

export const metadata: Metadata = {
  title: 'Liquidar Platform Chile — Subastas de Liquidación de Retailers Chilenos',
  description:
    'Compra lotes de liquidación de Falabella, Ripley, Paris, Lider, Sodimac y Corona con hasta 80% de descuento. Subastas online seguras para todo Chile.',
  keywords: 'liquidación, subastas, pallet, Falabella, Ripley, Paris, Chile, descuentos',
  openGraph: {
    title: 'Liquidar Platform — Subastas de Liquidación Chile',
    description: 'Lotes de liquidación de los mejores retailers chilenos. Puja y gana.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-amber-500/30">
      {/* Hero — Subastas destacadas + stats */}
      <HeroSection />

      {/* Lotes terminando pronto */}
      <FeaturedLots />

      {/* Cómo funciona — 4 pasos */}
      <ProcessSteps />

      {/* Retailers oficiales */}
      <RetailersSection />

      {/* Testimonios de compradores chilenos */}
      <TestimonialsSection />

      {/* Contacto y footer CTA */}
      <ContactSection />
    </main>
  );
}
