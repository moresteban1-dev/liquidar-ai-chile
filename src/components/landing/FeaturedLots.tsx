'use client';

/**
 * @file FeaturedLots.tsx
 * @description Featured auction lots section — replaces ServiceCatalog.
 * Shows 6 lots ending soonest with CountdownTimers.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import LoteCard from '@/components/subastas/LoteCard';
import { getLotesTerminandoPronto } from '@/lib/chile/mock-lotes';

const FEATURED_LOTES = getLotesTerminandoPronto(6);

export default function FeaturedLots() {
  return (
    <section className="py-20 bg-background" id="subastas">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-2">
              Subastas Activas
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Terminando Pronto ⏰
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              No pierdas la oportunidad. Estos lotes cierran en las próximas horas.
            </p>
          </div>
          <Link
            href="/subastas"
            className="hidden md:flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium transition-colors group"
          >
            Ver todas
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURED_LOTES.map((lote, index) => (
            <motion.div
              key={lote.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <LoteCard lote={lote} />
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center md:hidden"
        >
          <Link
            href="/subastas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors"
          >
            Ver todas las subastas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
