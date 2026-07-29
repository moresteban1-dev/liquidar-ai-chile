'use client';

/**
 * @file ProcessSteps.tsx
 * @description "Cómo Funciona" section for Liquidar Platform Chile.
 * Replaces dropservice steps with auction-specific flow.
 */

import { motion } from 'framer-motion';
import { Search, UserCheck, TrendingUp, PackageCheck } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Explora los Lotes',
    description:
      'Navega cientos de lotes de liquidación de Falabella, Ripley, Paris, Lider, Sodimac y Corona. Filtra por categoría, precio y región.',
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/20',
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'Regístrate con tu RUT',
    description:
      'Crea tu cuenta con tu RUT chileno en menos de 2 minutos. Proceso de verificación seguro y simple.',
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Puja con Proxy Bid',
    description:
      'Define tu precio máximo y el sistema pujará automáticamente por ti. No necesitas estar pendiente de la pantalla.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    number: '04',
    icon: PackageCheck,
    title: 'Gana y Recibe',
    description:
      'Si ganas, recibes notificación inmediata. Paga con Transbank o Khipu y coordina el envío a tu región.',
    color: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/20',
  },
];

export default function ProcessSteps() {
  return (
    <section className="py-20 bg-background/50" id="como-funciona">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-2">
            Proceso Simple
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Cómo Funciona?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            En 4 pasos simples puedes conseguir increíbles descuentos en productos de los mejores retailers chilenos.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="relative z-10"
            >
              <div className="bg-card border border-white/8 rounded-2xl p-6 text-center hover:border-white/15 transition-colors h-full">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg ${step.glow} mb-4`}
                >
                  <step.icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>

                {/* Step number */}
                <div className="text-xs font-bold text-muted-foreground tracking-widest mb-2">
                  PASO {step.number}
                </div>

                <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
