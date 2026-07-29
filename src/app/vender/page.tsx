import type { Metadata } from 'next';
import { TrendingUp, Shield, Clock, Users, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vender en Liquidar — Plataforma de Subastas Chile',
  description:
    'Liquida tu stock de manera eficiente. Vende pallets y lotes a compradores verificados en todo Chile. Proceso simple, pago garantizado.',
};

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Máximo valor de liquidación',
    description: 'Las subastas generan competencia entre compradores, maximizando el precio final de tus lotes.',
    color: 'text-emerald-400',
  },
  {
    icon: Shield,
    title: 'Compradores verificados',
    description: 'Todos los compradores están verificados con RUT chileno. Tus pagos están garantizados antes del despacho.',
    color: 'text-blue-400',
  },
  {
    icon: Clock,
    title: 'Publicación en 24 horas',
    description: 'Revisamos tu lote y lo publicamos en menos de 24 horas. Sin burocracia, sin demoras.',
    color: 'text-amber-400',
  },
  {
    icon: Users,
    title: 'Miles de compradores activos',
    description: 'Accede a nuestra base de compradores: revendedores, emprendedores y mayoristas en las 16 regiones.',
    color: 'text-purple-400',
  },
];

const STEPS = [
  { number: '01', title: 'Contacta con nosotros', desc: 'Llena el formulario y un ejecutivo te contactará en 24h.' },
  { number: '02', title: 'Envianos la info del lote', desc: 'Fotos, descripción y precio base mínimo que aceptarías.' },
  { number: '03', title: 'Publicamos la subasta', desc: 'Revisamos el lote y lo publicamos con fecha de cierre.' },
  { number: '04', title: 'Recibe el pago', desc: 'Cuando el comprador paga, te transferimos en 48 horas.' },
];

export default function VenderPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Para Vendedores</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Liquida tu Stock al{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
              Mejor Precio
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Únete a Falabella, Ripley, Paris y cientos de empresas que ya usan Liquidar para liquidar
            su stock eficientemente.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-card border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors"
            >
              <benefit.icon className={`w-8 h-8 ${benefit.color} mb-4`} aria-hidden="true" />
              <h3 className="text-white font-bold text-lg mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How it works for sellers */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">¿Cómo funciona para vendedores?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <div key={step.number} className="bg-card border border-white/8 rounded-2xl p-5 text-center">
                <div className="text-3xl font-bold text-amber-500/30 mb-2">{step.number}</div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/20 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Contáctanos</h2>
          <p className="text-muted-foreground text-center mb-8">
            Completa el formulario y un ejecutivo de ventas te contactará en menos de 24 horas.
          </p>
          <form
            className="max-w-2xl mx-auto space-y-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Empresa</label>
                <input
                  type="text"
                  placeholder="Nombre de tu empresa"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">RUT Empresa</label>
                <input
                  type="text"
                  placeholder="76.354.771-3"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="contacto@empresa.cl"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+56 9 XXXX XXXX"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Describe tu stock a liquidar
              </label>
              <textarea
                rows={4}
                placeholder="Tipo de productos, cantidad aproximada, valor estimado..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Enviar solicitud
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
