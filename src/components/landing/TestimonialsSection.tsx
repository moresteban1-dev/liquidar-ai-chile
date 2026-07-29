'use client';

/**
 * @file TestimonialsSection.tsx
 * @description Chilean buyer testimonials for Liquidar Platform.
 */

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'Compré un pallet de Samsung a través de Liquidar y ahorré más de $800.000 comparado con el precio de tienda. La plataforma es increíblemente fácil de usar.',
    author: 'Rodrigo M.',
    role: 'Revendedor de electrónica',
    location: 'Santiago, RM',
    rating: 5,
    savings: '$800.000',
    retailer: 'Falabella',
  },
  {
    quote:
      'Excelente experiencia. Gané un lote de ropa Paris y el envío llegó a Valparaíso en solo 2 días. Los productos estaban exactamente como se describían.',
    author: 'Carolina V.',
    role: 'Emprendedora de moda',
    location: 'Valparaíso, V Región',
    rating: 5,
    savings: '$340.000',
    retailer: 'Paris',
  },
  {
    quote:
      'Pagué con Transbank y fue todo muy seguro. Gané herramientas Corona a un precio increíble. Ya llevo 4 lotes comprados en Liquidar.',
    author: 'Miguel A.',
    role: 'Constructor independiente',
    location: 'Concepción, VIII Región',
    rating: 5,
    savings: '$480.000',
    retailer: 'Corona',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-background/50">
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
            Testimonios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lo Que Dicen Nuestros Compradores
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Miles de chilenos ya compraron con Liquidar. Estos son solo algunos de sus relatos.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, index) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-card border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors relative"
            >
              {/* Quote icon */}
              <Quote className="w-6 h-6 text-amber-500/40 absolute top-4 right-4" aria-hidden="true" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/80 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>

              {/* Author */}
              <div className="border-t border-white/8 pt-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm">{t.author}</div>
                  <div className="text-muted-foreground text-xs">{t.role}</div>
                  <div className="text-muted-foreground text-xs">📍 {t.location}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-emerald-400 font-bold text-sm">{t.savings}</div>
                  <div className="text-muted-foreground text-xs">ahorrados</div>
                  <div className="text-xs text-amber-400/70 mt-0.5">{t.retailer}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
