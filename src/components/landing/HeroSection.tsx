'use client';

/**
 * @file HeroSection.tsx
 * @description Liquidar Platform Chile — Hero section for the auction homepage.
 * Replaces the previous dropservice hero with auction-focused content.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingDown, Truck, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui';

const STATS = [
  { label: 'Lotes vendidos', value: '2.847', icon: '📦' },
  { label: 'Ahorrado por compradores', value: '$3.2MM', icon: '💰' },
  { label: 'Regiones con cobertura', value: '16', icon: '🇨🇱' },
  { label: 'Compradores satisfechos', value: '98%', icon: '⭐' },
];

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: 'Pago seguro Transbank' },
  { icon: Truck, label: 'Envío a todo Chile' },
  { icon: TrendingDown, label: 'Hasta 80% de descuento' },
];

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/25 via-background to-background relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] opacity-60 z-0" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-orange-500/10 rounded-full blur-[80px] opacity-40 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-amber-600/5 rounded-full blur-[100px] z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8 backdrop-blur-sm shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-amber-300 text-sm font-semibold tracking-wide">
              Subastas LIVE • Chile 🇨🇱
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight"
          >
            Compra Directo de los{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Mejores Retailers
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            Lotes de liquidación de <strong className="text-white/80">Falabella, Ripley, Paris y Lider</strong>{' '}
            con hasta 80% de descuento. Puja, gana y recibe en cualquier región de Chile.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link href="/subastas">
              <Button
                size="lg"
                className="h-13 px-8 text-base bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] transition-all hover:scale-105 active:scale-95 duration-200 font-semibold"
              >
                Ver Subastas Activas
              </Button>
            </Link>
            <Link href="/como-funciona">
              <Button
                variant="ghost"
                size="lg"
                className="h-13 px-8 text-base border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
              >
                Cómo Funciona
              </Button>
            </Link>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap mb-16"
          >
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-amber-500" aria-hidden="true" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-4 text-center hover:bg-white/8 transition-colors"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
