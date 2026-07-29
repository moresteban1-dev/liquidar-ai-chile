'use client';

/**
 * @file RetailersSection.tsx
 * @description Official retailers section — shows Chilean retail brands sourcing lots.
 */

import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

const RETAILERS = [
  {
    name: 'Falabella',
    description: 'Electrónica, ropa y hogar de la mayor tienda de Chile',
    emoji: '🏬',
    color: 'border-green-500/20 hover:border-green-500/40',
    badge: 'bg-green-500/10 text-green-400',
  },
  {
    name: 'Ripley',
    description: 'Moda, tecnología y artículos de temporada',
    emoji: '🛍️',
    color: 'border-blue-500/20 hover:border-blue-500/40',
    badge: 'bg-blue-500/10 text-blue-400',
  },
  {
    name: 'Paris',
    description: 'Estilo de vida, decoración y accesorios premium',
    emoji: '✨',
    color: 'border-pink-500/20 hover:border-pink-500/40',
    badge: 'bg-pink-500/10 text-pink-400',
  },
  {
    name: 'Lider',
    description: 'Hogar, alimentación, juguetes y artículos masivos',
    emoji: '🛒',
    color: 'border-amber-500/20 hover:border-amber-500/40',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  {
    name: 'Sodimac',
    description: 'Construcción, jardín, herramientas y mejoras del hogar',
    emoji: '🔨',
    color: 'border-orange-500/20 hover:border-orange-500/40',
    badge: 'bg-orange-500/10 text-orange-400',
  },
  {
    name: 'Corona',
    description: 'Ferretería, jardín y productos para el hogar',
    emoji: '🌿',
    color: 'border-emerald-500/20 hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-400',
  },
];

export default function RetailersSection() {
  return (
    <section className="py-20 bg-background" id="retailers">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-2">
            Fuentes Oficiales
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Liquidaciones Directas de los Mejores Retailers
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Compramos lotes directamente a las tiendas más grandes de Chile. Sin intermediarios. Precios reales.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RETAILERS.map((retailer, index) => (
            <motion.div
              key={retailer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className={`bg-card border ${retailer.color} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{retailer.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-lg">{retailer.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${retailer.badge}`}>
                      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
                      Oficial
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{retailer.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
