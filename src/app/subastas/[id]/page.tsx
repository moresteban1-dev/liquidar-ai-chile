import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Package, Scale, Calendar, Tag, Store, Clock } from 'lucide-react';
import { getLoteById, MOCK_LOTES } from '@/lib/chile/mock-lotes';
import { CLPFormatter } from '@/lib/chile/clp-formatter';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import CountdownTimer from '@/components/subastas/CountdownTimer';
import ProxyBidForm from '@/components/subastas/ProxyBidForm';

interface LotePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return MOCK_LOTES.map((lote) => ({ id: lote.id }));
}

export async function generateMetadata({ params }: LotePageProps): Promise<Metadata> {
  const { id } = await params;
  const lote = getLoteById(id);
  if (!lote) return { title: 'Lote no encontrado' };

  return {
    title: `${lote.titulo} — Liquidar Platform Chile`,
    description: `${lote.descripcion.slice(0, 150)}... Precio actual: ${CLPFormatter.format(lote.precioActual)}`,
  };
}

const CONDICION_LABELS = {
  nuevo: 'Nuevo',
  como_nuevo: 'Como Nuevo',
  bueno: 'Bueno',
  aceptable: 'Aceptable',
};

// Estimated shipping prices per region (mock data)
const SHIPPING_PRICES: Record<string, { precio: number; dias: number }> = {
  RM: { precio: 5000, dias: 1 },
  V: { precio: 12000, dias: 2 },
  VIII: { precio: 18000, dias: 3 },
  IX: { precio: 22000, dias: 4 },
  X: { precio: 28000, dias: 5 },
  DEFAULT: { precio: 35000, dias: 7 },
};

export default async function LotePage({ params }: LotePageProps) {
  const { id } = await params;
  const lote = getLoteById(id);

  if (!lote) notFound();

  const categoriaLabel = CATEGORIA_LABELS[lote.categoria] ?? lote.categoria;
  const condicionLabel = CONDICION_LABELS[lote.condicion];

  // Mock bid history
  const bidHistory = [
    { user: 'R***o M.', monto: lote.precioActual, time: '2h atrás' },
    { user: 'C***a V.', monto: lote.precioActual - lote.incrementoMinimo, time: '3h atrás' },
    { user: 'M***l A.', monto: lote.precioActual - lote.incrementoMinimo * 2, time: '5h atrás' },
  ].filter((b) => b.monto > 0);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-white transition-colors">Inicio</a>
          <span>/</span>
          <a href="/subastas" className="hover:text-white transition-colors">Subastas</a>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{lote.titulo}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Left Column: Details ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Image Gallery Placeholder */}
            <div className="bg-card border border-white/8 rounded-2xl overflow-hidden">
              <div className="h-72 md:h-96 bg-gradient-to-br from-amber-900/30 to-orange-900/20 flex flex-col items-center justify-center">
                <Package className="w-16 h-16 text-white/20 mb-3" aria-hidden="true" />
                <span className="text-white/30 text-sm font-medium">{lote.loteNumero}</span>
                <span className="text-white/20 text-xs mt-1">Imágenes del lote</span>
              </div>
            </div>

            {/* Title and badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                  <Store className="w-3 h-3" />
                  {lote.retailerOrigen}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-muted-foreground text-xs rounded-full">
                  <Tag className="w-3 h-3" />
                  {categoriaLabel}
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-muted-foreground text-xs rounded-full">
                  {condicionLabel}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{lote.titulo}</h1>
            </div>

            {/* Description */}
            <div className="bg-card border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Descripción del Lote</h2>
              <p className="text-muted-foreground leading-relaxed">{lote.descripcion}</p>
            </div>

            {/* Details table */}
            <div className="bg-card border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4">Detalles del Lote</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Tag, label: 'Categoría', value: categoriaLabel },
                  { icon: Scale, label: 'Condición', value: condicionLabel },
                  { icon: Package, label: 'Número de lote', value: lote.loteNumero },
                  { icon: Store, label: 'Retailer origen', value: lote.retailerOrigen },
                  { icon: MapPin, label: 'Ubicación', value: `${lote.comuna}, ${lote.region}` },
                  ...(lote.pesoKg ? [{ icon: Scale, label: 'Peso', value: `${lote.pesoKg} kg` }] : []),
                  ...(lote.volumenM3 ? [{ icon: Package, label: 'Volumen', value: `${lote.volumenM3} m³` }] : []),
                  { icon: Calendar, label: 'Total pujas', value: `${lote.totalPujas} pujas` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <dt className="text-muted-foreground text-sm w-28 flex-shrink-0">{label}</dt>
                    <dd className="text-white text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Seller info */}
            {lote.vendedor && (
              <div className="bg-card border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Vendedor</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-2xl">
                    🏬
                  </div>
                  <div>
                    <div className="text-white font-semibold">{lote.vendedor.nombreEmpresa}</div>
                    <div className="text-muted-foreground text-sm">{lote.vendedor.ciudad}, {lote.vendedor.region}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-400 text-sm">★ {lote.vendedor.rating}</span>
                      <span className="text-muted-foreground text-xs">({lote.vendedor.totalLotes} lotes)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column: Bidding ─────────────────────────────────────── */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Price card */}
              <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-4">
                {/* Current price */}
                <div>
                  <div className="text-muted-foreground text-xs font-medium mb-1">PRECIO ACTUAL</div>
                  <div className="text-3xl font-bold text-white">{CLPFormatter.format(lote.precioActual)}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Precio base: {CLPFormatter.format(lote.precioBase)}
                  </div>
                </div>

                {/* Countdown */}
                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    Cierra en
                  </div>
                  <CountdownTimer endDate={lote.fechaFin} showIcon={false} className="text-base" />
                </div>

                {/* Bid form */}
                <ProxyBidForm lote={lote} isAuthenticated={false} />
              </div>

              {/* Bid history */}
              {bidHistory.length > 0 && (
                <div className="bg-card border border-white/8 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-3">Últimas Pujas</h3>
                  <ul className="space-y-2">
                    {bidHistory.map((bid, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0"
                      >
                        <div>
                          <span className="text-white/70">{bid.user}</span>
                          <span className="text-muted-foreground text-xs ml-2">{bid.time}</span>
                        </div>
                        <span className={`font-semibold ${index === 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {CLPFormatter.format(bid.monto)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Shipping estimator */}
              <div className="bg-card border border-white/8 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  Envío Estimado
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { region: 'RM', label: 'Metropolitana' },
                    { region: 'V', label: 'Valparaíso' },
                    { region: 'VIII', label: 'Biobío' },
                    { region: 'IX', label: 'Araucanía' },
                  ].map(({ region, label }) => {
                    const shipping = (SHIPPING_PRICES[region] ?? SHIPPING_PRICES['DEFAULT'])!;
                    return (
                      <div key={region} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                        <span className="text-muted-foreground">{label}</span>
                        <div className="text-right">
                          <span className="text-white font-medium">{CLPFormatter.format(shipping.precio)}</span>
                          <span className="text-muted-foreground text-xs ml-2">{shipping.dias}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs mt-3">* Precios estimados. El precio final se confirma al ganar.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
