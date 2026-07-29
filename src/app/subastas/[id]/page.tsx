import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Package, Scale, Calendar, Tag, Store, Clock, ShieldCheck, Truck, Percent, AlertCircle } from 'lucide-react';
import { getLoteById, MOCK_LOTES } from '@/lib/chile/mock-lotes';
import { CLPFormatter } from '@/lib/chile/clp-formatter';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import CountdownTimer from '@/components/subastas/CountdownTimer';
import ProxyBidForm from '@/components/subastas/ProxyBidForm';
import ManifestModal from '@/components/subastas/ManifestModal';

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

const TAMANO_LABELS = {
  unidad_individual: 'Unidad Individual',
  palet_completo: 'Palet Completo',
  camion_truckload: 'Camión Truckload',
  item_voluminoso: 'Item Voluminoso',
};

const FORMATO_LABELS = {
  subasta_estandar: 'Subasta Estándar',
  precio_fijo: 'Precio Fijo (Compra Ya)',
  sobre_cerrado: 'Sobre Cerrado (Confidencial)',
  formato_mixto: 'Formato Mixto',
};

const DESPACHO_LABELS = {
  retiro_bodega: 'Retiro en Bodega',
  despacho_liquidar: 'Despacho por Liquidar.cl',
  flete_comprador: 'Comprador Organiza Flete',
  despacho_vendedor: 'Despacho Organizado por Vendedor',
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
  const tamanoLabel = lote.tamanoLote ? TAMANO_LABELS[lote.tamanoLote] : 'Palet Completo';
  const formatoLabel = lote.formatoVenta ? FORMATO_LABELS[lote.formatoVenta] : 'Subasta Estándar';
  const despachoLabel = lote.terminoDespacho ? DESPACHO_LABELS[lote.terminoDespacho] : 'Despacho por Liquidar.cl';

  // MSRP savings percentage
  const porcentajeAhorro = lote.msrpTotal && lote.msrpTotal > lote.precioActual
    ? Math.round(((lote.msrpTotal - lote.precioActual) / lote.msrpTotal) * 100)
    : null;

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
            {/* Image Gallery Placeholder with Lightbox Badges */}
            <div className="bg-card border border-white/8 rounded-2xl overflow-hidden relative">
              <div className="h-72 md:h-96 bg-gradient-to-br from-amber-900/30 to-orange-900/20 flex flex-col items-center justify-center">
                <Package className="w-16 h-16 text-white/20 mb-3" aria-hidden="true" />
                <span className="text-white/40 text-sm font-semibold tracking-wider">{lote.loteNumero}</span>
                <span className="text-white/20 text-xs mt-1">Galería de Imágenes del Lote (1/6)</span>
              </div>
              
              {/* Badges overlay on image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  {tamanoLabel}
                </span>
                {porcentajeAhorro && (
                  <span className="px-3 py-1 bg-emerald-500/90 text-black text-xs font-bold rounded-lg shadow-sm">
                    -{porcentajeAhorro}% MSRP Retail
                  </span>
                )}
              </div>
            </div>

            {/* Title, Retailer & Manifest Action Bar */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
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
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                    {formatoLabel}
                  </span>
                </div>

                {/* PDF Manifest Download / Preview Button */}
                <ManifestModal
                  loteNumero={lote.loteNumero}
                  tituloLote={lote.titulo}
                  manifestUrl={lote.manifestUrl}
                  msrpTotal={lote.msrpTotal}
                  retailerOrigen={lote.retailerOrigen}
                />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-white">{lote.titulo}</h1>

              {/* MSRP Valuation Banner */}
              {lote.msrpTotal && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Valor MSRP Retail Estimado</div>
                    <div className="text-xl font-bold text-white mt-0.5">{CLPFormatter.format(lote.msrpTotal)}</div>
                  </div>
                  {porcentajeAhorro && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Ahorro sobre Precio Retail</div>
                      <div className="text-lg font-bold text-emerald-400">-{porcentajeAhorro}% de Descuento</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sealed Bid Disclaimer Notice (If sealed bid format) */}
            {lote.formatoVenta === 'sobre_cerrado' && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-5 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs leading-relaxed text-amber-200/90">
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-xs block">
                    Atención: Subasta de Sobre Cerrado (Sealed Bid)
                  </span>
                  <p>
                    Todas las ofertas en esta modalidad se mantienen strictly confidenciales. Los postores pueden aumentar su oferta en cualquier momento antes del cierre, pero no se permite reducirla. Al pujar, ingresas a un contrato vinculante. No existe puja proxy en sobres cerrados.
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-card border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Descripción del Lote</h2>
              <p className="text-muted-foreground leading-relaxed">{lote.descripcion}</p>
            </div>

            {/* Detailed Lot Specifications Sheet (Hoja de Especificaciones B2B) */}
            <div className="bg-card border border-white/8 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-4 flex items-center justify-between">
                <span>Especificaciones del Lote</span>
                <span className="text-xs font-mono text-amber-400 font-normal">ID: {lote.loteNumero}</span>
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Store, label: 'Retailer Origen', value: lote.retailerOrigen },
                  { icon: Tag, label: 'Categoría', value: categoriaLabel },
                  { icon: Scale, label: 'Condición del Stock', value: condicionLabel },
                  { icon: Package, label: 'Tamaño del Lote', value: tamanoLabel },
                  { icon: MapPin, label: 'Ubicación / Bodega', value: `${lote.comuna}, ${lote.region}` },
                  { icon: Truck, label: 'Términos de Despacho', value: despachoLabel },
                  ...(lote.pesoKg ? [{ icon: Scale, label: 'Peso Total Estimado', value: `${lote.pesoKg} kg` }] : []),
                  ...(lote.volumenM3 ? [{ icon: Package, label: 'Volumen Ocupado', value: `${lote.volumenM3} m³` }] : []),
                  { icon: Percent, label: 'Comisión Comprador', value: '11% (IVA Incluido)' },
                  { icon: ShieldCheck, label: 'Varianza Cantidad', value: '±8% Máximo' },
                  { icon: Calendar, label: 'Total Pujas Emitidas', value: `${lote.totalPujas} pujas` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <Icon className="w-4 h-4 text-amber-400/80 flex-shrink-0" aria-hidden="true" />
                    <dt className="text-muted-foreground text-xs w-32 flex-shrink-0">{label}</dt>
                    <dd className="text-white text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Seller Info Card */}
            {lote.vendedor && (
              <div className="bg-card border border-white/8 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Vendedor Verificado</h2>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-2xl">
                      🏬
                    </div>
                    <div>
                      <div className="text-white font-semibold flex items-center gap-2">
                        {lote.vendedor.nombreEmpresa}
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-muted-foreground text-xs">{lote.vendedor.ciudad}, {lote.vendedor.region} • RUT: {lote.vendedor.rut}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-amber-400 text-xs font-semibold">★ {lote.vendedor.rating} / 5.0</span>
                        <span className="text-muted-foreground text-xs">({lote.vendedor.totalLotes} lotes comercializados)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right Column: Bidding & Pricing Box ─────────────────────── */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Price & Action Card */}
              <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
                {/* Current price & Base price */}
                <div>
                  <div className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">
                    {lote.formatoVenta === 'sobre_cerrado' ? 'Oferta Base Sugerida' : 'Precio Actual de Subasta'}
                  </div>
                  <div className="text-3xl font-bold text-white">{CLPFormatter.format(lote.precioActual)}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Precio base inicial: {CLPFormatter.format(lote.precioBase)}
                  </div>
                </div>

                {/* Buy Now Option (if enabled for lot) */}
                {lote.precioCompraYa && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-emerald-400 font-semibold mb-1">PRECIO COMPRA YA</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl font-bold text-white">{CLPFormatter.format(lote.precioCompraYa)}</span>
                      <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer">
                        Comprar Ya
                      </button>
                    </div>
                  </div>
                )}

                {/* Countdown */}
                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    Cierre de Subasta
                  </div>
                  <CountdownTimer endDate={lote.fechaFin} showIcon={false} className="text-sm font-semibold" />
                </div>

                {/* Bid form */}
                <ProxyBidForm lote={lote} isAuthenticated={false} />
              </div>

              {/* Bid history */}
              {bidHistory.length > 0 && (
                <div className="bg-card border border-white/8 rounded-2xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-3">Historial Reciente de Pujas</h3>
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

              {/* Shipping Estimator */}
              <div className="bg-card border border-white/8 rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  Cotizador de Flete Estimado
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
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <div className="text-right">
                          <span className="text-white font-semibold text-xs">{CLPFormatter.format(shipping.precio)}</span>
                          <span className="text-muted-foreground text-[10px] ml-1.5">{shipping.dias}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-[10px] mt-3">* Precios de flete calculados según peso y volumen. Confirmación al adjudicar.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
