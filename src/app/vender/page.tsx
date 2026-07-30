import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, ShieldCheck, Zap, UserCheck, HelpCircle, CheckCircle, ChevronRight, Building2, PhoneCall, Mail } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';

export const metadata: Metadata = {
  title: 'Por qué Vender en Liquidar.cl — Convierta su Inventario Excedente en Efectivo',
  description:
    'Venda su exceso de inventario, devoluciones de retail y sobrestock en Liquidar.cl. Aumente su recuperación entre un 20% y 80% y reduzca costos operacionales.',
};

const SELLER_PILLARS = [
  {
    icon: TrendingUp,
    title: 'Mayor Recuperación Financiera',
    description: 'Nuestras estrategias de subasta y licitación aumentan su recuperación entre un 20% y un 80% en comparación con la liquidación interna o informal.',
    color: 'text-amber-400',
    badge: '+20% a +80% Recuperación',
  },
  {
    icon: ShieldCheck,
    title: 'Reducción Significativa de Costos',
    description: 'Al externalizar la gestión de su inventario excedente, su empresa puede reducir los costos del programa entre un 30% y un 60% en promedio.',
    color: 'text-emerald-400',
    badge: '30% a 60% Menos Costos',
  },
  {
    icon: Zap,
    title: 'Ventas Rápidas y Autoservicio',
    description: 'Nuestra tecnología elimina la publicación manual. Llegue rápidamente a más de 45.000 revendedores, comerciantes y pymes en todo Chile.',
    color: 'text-blue-400',
    badge: 'Publicación Inmediata',
  },
  {
    icon: UserCheck,
    title: 'Gestor de Cuenta Confiable y Dedicado',
    description: 'Trabaje directamente con un especialista asignado comprometido con asesorarlo en tendencias del mercado, precios base y estrategias de venta.',
    color: 'text-purple-400',
    badge: 'Soporte Personalizado 1 a 1',
  },
];

const SELLER_TESTIMONIALS = [
  {
    quote: "Liquidar.cl ha sido extremadamente beneficioso para nuestra empresa. La plataforma nos ha presentado a muchos compradores nuevos en todas las regiones de Chile. Nos encanta trabajar con su equipo de gestores de cuenta; son atentos, creativos y maximizan el alcance de nuestros productos.",
    company: "Compañía de Suministros del Sur SpA",
    author: "Dirección de Operaciones & Inventarios",
  },
  {
    quote: "Hemos sido compradores y vendedores frecuentes en Liquidar.cl durante los últimos años y estamos sumamente satisfechos con la relación. El servicio al cliente es excepcional. Trabajamos directamente con ejecutivos que se esfuerzan al máximo para satisfacer nuestras metas comerciales.",
    company: "Maxbuckets Chile",
    author: "Gerencia Comercial",
  },
  {
    quote: "Llevar años vendiendo en la plataforma nos ha permitido hacer crecer nuestro negocio. Nuestro gestor de cuenta nos ha guiado a través de cambios de líneas de productos y estrategias de publicación. Su asesoramiento ha sido fundamental para nuestro éxito continuo.",
    company: "Importadora AmanFashion",
    author: "Área de Grandes Clientes",
  },
];

const FAQS = [
  {
    q: '¿Qué tipo de mercadería puedo vender en Liquidar.cl?',
    a: 'Aceptamos sobrestock de temporada, devoluciones comerciales, artículos de caja abierta, saldos de bodega y lotes paletizados en categorías como Tecnología, Vestuario, Hogar, Herramientas, Electrodomésticos y Construcción.',
  },
  {
    q: '¿Quién organiza la logística de despacho y retiro?',
    a: '¡No te preocupes por el envío! En Liquidar.cl coordinamos y gestionamos la logística de transporte y retiros en bodegas según los términos acordados para cada subasta.',
  },
  {
    q: '¿Cómo recibo el pago de mis lotes vendidos?',
    a: 'Una vez concluida la subasta y verificado el pago del comprador en nuestra cuenta de custodia, transferimos directamente los fondos a la cuenta bancaria de tu empresa en 48 horas.',
  },
];

export default function VenderPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16 selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* ─── Hero Header ──────────────────────────────────────────────────── */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
            Portal Oficial de Vendedores B2B
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Convierta su Inventario Excedente en{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Efectivo Líquido
            </span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto font-medium">
            ¡Es muy sencillo! Solo tienes que publicar, vender y cobrar con **Liquidar.cl**.
          </p>
        </div>

        {/* ─── Business Pain Points Banner ──────────────────────────────────── */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 mb-20 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              ¿Su empresa enfrentando exceso de inventario y costos de bodegaje?
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 text-left pt-2">
              <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4">
                <div className="text-amber-400 font-bold text-sm mb-1">¿Espacio Bloqueado?</div>
                <p className="text-slate-400 text-xs">El exceso de inventario ocupa metros cuadrados valiosos en sus bodegas.</p>
              </div>
              <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4">
                <div className="text-amber-400 font-bold text-sm mb-1">¿Capital Inmovilizado?</div>
                <p className="text-slate-400 text-xs">Mercadería de retornos o temporadas pasadas que frena su flujo de caja.</p>
              </div>
              <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4">
                <div className="text-amber-400 font-bold text-sm mb-1">¿Canales Lentos?</div>
                <p className="text-slate-400 text-xs">Canales habituales que no pueden absorber volúmenes de palets o camiones.</p>
              </div>
            </div>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed pt-2">
              Todas las empresas tienen mercancía desactualizada, excedente o devuelta que no pueden vender por sus canales tradicionales. **Simplifique su negocio y transforme estos activos en una oportunidad altamente rentable.**
            </p>
          </div>
        </div>

        {/* ─── Why Liquidar.cl (4 Pillars) ─────────────────────────────────── */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">¿Por qué vender en Liquidar.cl?</h2>
            <p className="text-muted-foreground text-sm">
              Empresas de todos los tamaños y sectores confían en nuestra plataforma para convertir excedentes en rentabilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SELLER_PILLARS.map((p) => (
              <div key={p.title} className="bg-card/80 border border-white/10 rounded-3xl p-8 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400">
                      <p.icon className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{p.title}</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Testimonials from Real Sellers ───────────────────────────────── */}
        <div className="mb-24 bg-slate-900/60 border border-white/10 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">
            Experiencias de Vendedores Corporativos
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SELLER_TESTIMONIALS.map((st) => (
              <div key={st.company} className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-slate-300 text-xs leading-relaxed italic mb-6">"{st.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="text-white font-bold text-sm">{st.company}</div>
                  <div className="text-amber-400 text-xs font-medium">{st.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Seller Onboarding Steps ──────────────────────────────────────── */}
        <div className="mb-24 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/20 rounded-3xl p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Cómo Empezar a Vender</h2>
            <p className="text-slate-300 text-sm">Vender en Liquidar.cl nunca ha sido tan fácil. Complete el formulario y un gestor asignado lo guiará en todo el proceso.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-400 mb-2">1</div>
              <h3 className="text-white font-bold text-base mb-2">Cuéntenos sobre su Empresa</h3>
              <p className="text-slate-400 text-xs">Dígamos qué tipo de mercancía o stock desea liquidar (palets, cajas o camiones).</p>
            </div>
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-400 mb-2">2</div>
              <h3 className="text-white font-bold text-base mb-2">Asignación de Ejecutivo</h3>
              <p className="text-slate-400 text-xs">Un gestor de cuenta especializado lo ayudará a configurar su perfil y publicar sus lotes con fotos y manifiesto.</p>
            </div>
            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-extrabold text-amber-400 mb-2">3</div>
              <h3 className="text-white font-bold text-base mb-2">Publicar, Vender y Cobrar</h3>
              <p className="text-slate-400 text-xs">Nosotros organizamos el envío y la recaudación. Su empresa recibe el pago directamente en su cuenta bancaria.</p>
            </div>
          </div>
        </div>

        {/* ─── Contact Form Section ─────────────────────────────────────────── */}
        <div id="contacto-vendedores" className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                Formulario Directo para Vendedores Corporativos
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Solicite la Apertura de su Cuenta de Vendedor</h2>
              <p className="text-slate-400 text-sm">
                Un ejecutivo comercial de Liquidar.cl lo contactará en menos de 24 horas hábiles.
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre de Empresa o Razón Social</label>
                  <input
                    type="text"
                    placeholder="Ej. Comercializadora SpA"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">RUT Empresa</label>
                  <input
                    type="text"
                    placeholder="Ej. 76.123.456-K"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Corporativo</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.cl"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teléfono Directo / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+56 9 XXXX XXXX"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detalle del Inventario Excedente a Liquidar
                </label>
                <textarea
                  rows={4}
                  placeholder="Describa el tipo de artículos (tecnología, ropa, hogar...), volumen estimado (palets o camiones) y ubicación de bodega..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                Enviar Solicitud de Registro de Vendedor
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ─── FAQs Section ─────────────────────────────────────────────────── */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            Preguntas Frecuentes de Vendedores
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold text-sm mb-2">{faq.q}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
