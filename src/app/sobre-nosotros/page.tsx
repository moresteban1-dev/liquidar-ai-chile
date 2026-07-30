import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, TrendingUp, RefreshCw, Truck, Award, Users, CheckCircle, ArrowRight, Building2 } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Liquidar.cl | Plataforma B2B de Subastas de Liquidación',
  description:
    'Conoce la historia, misión y tecnología detrás de Liquidar.cl. Conectamos los excedentes de los grandes retailers en Chile con miles de revendedores y pymes.',
};

const STATS = [
  { label: 'Recuperación de Activos', value: '20% - 80%', subtext: 'Superior a la liquidación interna' },
  { label: 'Revendedores Activos', value: '+45.000', subtext: 'Compradores en las 16 regiones' },
  { label: 'Reducción de Costos', value: '30% - 60%', subtext: 'Ahorro operacional para retailers' },
  { label: 'Despacho & Retiro', value: '100% Chile', subtext: 'Arica a Punta Arenas + Bodegas RM' },
];

const VALUES = [
  {
    icon: TrendingUp,
    title: 'Máxima Eficiencia Financiera',
    description: 'Transformamos retornos comerciales y sobrestock en liquidez inmediata con una tasa de recuperación significativamente superior a los canales tradicionales.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparencia y Manifiestos Auditables',
    description: 'Cada lote paletizado incluye un manifiesto PDF oficial con SKUs, cantidades, condiciones y MSRP Retail verificado bajo normativa chilena.',
  },
  {
    icon: RefreshCw,
    title: 'Economía Circular y Sostenibilidad',
    description: 'Evitamos el descarte de productos reincorporando excedentes comerciales a la economía productiva de emprendedores y pymes en Chile.',
  },
  {
    icon: Truck,
    title: 'Cobertura Logística Nacional',
    description: 'Gestión coordinada de despachos a todas las regiones de Chile o retiro directo en bodegas centrales en la Región Metropolitana.',
  },
];

const TESTIMONIALS = [
  {
    quote: "Liquidar.cl ha sido fundamental para nuestra pyme. La transparencia en los manifiestos PDF y la velocidad de entrega nos permite abastecer nuestro negocio con productos de retail con excelente margen.",
    author: "Maximiliano Fuentes",
    company: "Distribuidora MF (Santiago)",
    badge: "Comprador de Palets"
  },
  {
    quote: "Como importadores de artículos de hogar, el exceso de inventario de temporada nos generaba un costo de bodegaje enorme. Gracias al modelo de subastas de Liquidar.cl liberamos espacio y cobramos en 48 horas.",
    author: "Camila Santander",
    company: "Importaciones & Soluciones SpA",
    badge: "Vendedor Corporativo"
  },
  {
    quote: "La plataforma es increíblemente seria. Todos los lotes vienen con su factura y manifiesto legalizado. Llevamos 2 años comprando lotes de tecnología y electro con cero contratiempos.",
    author: "Ignacio Soto",
    company: "Comercializadora El Dorado (Concepción)",
    badge: "Revendedor Frecuente"
  }
];

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* ─── Hero Section ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Building2 className="w-3.5 h-3.5" />
            Sobre Nosotros
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            El Motor B2B de Liquidación de Stock en{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Chile
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Conectamos los excedentes de inventario, devoluciones de clientes y sobrestock de los principales retailers de Chile con una red activa de revendedores, comerciantes y pymes de Arica a Punta Arenas.
          </p>
        </div>

        {/* ─── Stats Banner ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-xl hover:border-amber-500/30 transition-all">
              <div className="text-3xl lg:text-4xl font-extrabold text-amber-400 mb-1">{stat.value}</div>
              <div className="text-white font-bold text-sm mb-1">{stat.label}</div>
              <div className="text-muted-foreground text-xs">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* ─── Story & Mission Section ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24 bg-slate-900/60 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-2xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Nuestra Misión
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Transformamos Excedentes de Retail en Oportunidades Rentables
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Todas las grandes empresas y distribuidores generan mercadería desactualizada, sobrestock o retornos de clientes que no pueden comercializar a través de sus tiendas principales. Tradicionalmente, la gestión de estos activos significaba altos costos de almacenamiento o ventas informales con bajas tasas de retorno.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              En **Liquidar.cl** simplificamos este proceso. A través de nuestra tecnología de autoservicio y subastas digitales transparentes, permitimos a los retailers liquidar volúmenes masivos de palets y camiones completos de forma rápida y segura, mientras brindamos a miles de pymes chilenas la oportunidad de adquirir inventarios de calidad a precios altamente competitivos.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/subastas"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                Explorar Subastas Activas
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vender"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all border border-white/10"
              >
                Vender Excedentes
              </Link>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-8 space-y-6 text-slate-300">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
              ¿Por qué elegir Liquidar.cl?
            </h3>
            <ul className="space-y-4 text-xs md:text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Formato 100% Transparente:</strong> Subastas en línea, puja directa, sobre cerrado y compra inmediata.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Manifiestos Certificados:</strong> Descarga directa en PDF con detalle de ítems, SKUs y valores MSRP.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Cumplimiento Legal Chileno:</strong> Emisión de factura electrónica y protección al comprador.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Atención Personalizada:</strong> Ejecutivos de cuenta dedicados para grandes vendedores y compradores.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Pillars Grid ─────────────────────────────────────────────────── */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Nuestros Pilares Operativos</h2>
            <p className="text-muted-foreground text-sm">Diseñados para garantizar seguridad, rapidez y rentabilidad en cada transacción.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val) => (
              <div key={val.title} className="bg-card/70 border border-white/10 rounded-2xl p-6 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-lg">
                <div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-5">
                    <val.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-3">{val.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Testimonials ─────────────────────────────────────────────────── */}
        <div className="mb-24 bg-slate-900/40 border border-white/10 rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              Testimonios de Nuestra Comunidad
            </div>
            <h2 className="text-3xl font-bold text-white">Lo que dicen nuestros Compradores y Vendedores</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-md">
                <p className="text-slate-300 text-xs leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white font-bold text-sm">{t.author}</div>
                  <div className="text-amber-400 text-xs font-medium">{t.company}</div>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                    {t.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Bottom CTA ───────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border border-amber-500/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">¿Listo para potenciar tu negocio con Liquidar.cl?</h2>
            <p className="text-slate-300 text-sm mb-8">
              Únete a miles de compradores y los principales retailers en Chile. Registra tu cuenta y accede a las mejores subastas de liquidación.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl transition-all shadow-xl shadow-amber-500/20"
              >
                Crear Cuenta de Comprador
              </Link>
              <Link
                href="/vender"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/20"
              >
                Vender Lotes de Stock
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
