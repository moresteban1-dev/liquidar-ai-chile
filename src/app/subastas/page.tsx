import type { Metadata } from 'next';
import { Filter, Tag, MapPin, DollarSign, ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import { MOCK_LOTES } from '@/lib/chile/mock-lotes';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import type { CategoriaLote, FiltrosSubasta } from '@/types/liquidar';
import LoteCard from '@/components/subastas/LoteCard';

export const metadata: Metadata = {
  title: 'Subastas Activas — Liquidar Platform Chile',
  description:
    'Explora todos los lotes de liquidación disponibles. Filtra por categoría, precio y región. Puja y gana con hasta 80% de descuento.',
};

interface SubastasPageProps {
  searchParams: Promise<{
    categoria?: string;
    precioMin?: string;
    precioMax?: string;
    region?: string;
    ordenar?: string;
  }>;
}

const ORDENAR_OPTIONS = [
  { value: 'fecha_fin_asc', label: 'Terminando pronto' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'recientes', label: 'Más recientes' },
];

const REGIONES = [
  { value: 'RM', label: 'Metropolitana' },
  { value: 'V', label: 'Valparaíso' },
  { value: 'VIII', label: 'Biobío' },
  { value: 'IX', label: 'Araucanía' },
  { value: 'X', label: 'Los Lagos' },
];

export default async function SubastasPage({ searchParams }: SubastasPageProps) {
  const params = await searchParams;

  // ─── Build filters from searchParams ────────────────────────────────────────
  const filters: FiltrosSubasta = {
    categoria: params.categoria as CategoriaLote | undefined,
    precioMin: params.precioMin ? parseInt(params.precioMin, 10) : undefined,
    precioMax: params.precioMax ? parseInt(params.precioMax, 10) : undefined,
    region: params.region,
    ordenar: (params.ordenar as FiltrosSubasta['ordenar']) ?? 'fecha_fin_asc',
  };

  // ─── Filter mock data ────────────────────────────────────────────────────────
  let lotes = [...MOCK_LOTES];

  if (filters.categoria) {
    lotes = lotes.filter((l) => l.categoria === filters.categoria);
  }
  if (filters.precioMin) {
    lotes = lotes.filter((l) => l.precioActual >= filters.precioMin!);
  }
  if (filters.precioMax) {
    lotes = lotes.filter((l) => l.precioActual <= filters.precioMax!);
  }
  if (filters.region) {
    lotes = lotes.filter((l) => l.region === filters.region);
  }

  // Sort
  switch (filters.ordenar) {
    case 'fecha_fin_asc':
      lotes.sort((a, b) => new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime());
      break;
    case 'precio_asc':
      lotes.sort((a, b) => a.precioActual - b.precioActual);
      break;
    case 'precio_desc':
      lotes.sort((a, b) => b.precioActual - a.precioActual);
      break;
    case 'recientes':
      lotes.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
      break;
  }

  const activeFilterCount = [filters.categoria, filters.precioMin, filters.precioMax, filters.region].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Subastas Activas
            </h1>
            <p className="text-muted-foreground text-sm">
              {lotes.length} lote{lotes.length !== 1 ? 's' : ''} disponible{lotes.length !== 1 ? 's' : ''} en liquidación
              {hasFilters && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Filter className="w-3 h-3" />
                  {activeFilterCount} filtro{activeFilterCount !== 1 ? 's' : ''} activo{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Sidebar Filters ───────────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <form method="GET" className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5 sticky top-24 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Filter className="w-4 h-4 text-amber-400" />
                  Filtros de Búsqueda
                </h2>
                {hasFilters && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Filtrado
                  </span>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <Tag className="w-3.5 h-3.5 text-amber-400/80" />
                  Categoría
                </label>
                <div className="relative">
                  <select
                    name="categoria"
                    defaultValue={filters.categoria ?? ''}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none [&>option]:bg-slate-900 [&>option]:text-white [&>option]:py-2"
                  >
                    <option value="" className="bg-slate-900 text-white font-medium">Todas las Categorías</option>
                    {(Object.entries(CATEGORIA_LABELS) as [CategoriaLote, string][]).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-900 text-white font-medium py-2">
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              {/* Región */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400/80" />
                  Ubicación / Región
                </label>
                <div className="relative">
                  <select
                    name="region"
                    defaultValue={filters.region ?? ''}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none [&>option]:bg-slate-900 [&>option]:text-white [&>option]:py-2"
                  >
                    <option value="" className="bg-slate-900 text-white font-medium">Todas las Regiones</option>
                    {REGIONES.map((r) => (
                      <option key={r.value} value={r.value} className="bg-slate-900 text-white font-medium py-2">
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              {/* Precio Rango */}
              <div className="space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400/80" />
                  Rango de Precio (CLP)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      name="precioMin"
                      defaultValue={filters.precioMin}
                      placeholder="Mín ($0)"
                      min={0}
                      step={10000}
                      className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="precioMax"
                      defaultValue={filters.precioMax}
                      placeholder="Máx ($)"
                      min={0}
                      step={10000}
                      className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3 py-2 text-white text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400/80" />
                  Ordenar resultados
                </label>
                <div className="relative">
                  <select
                    name="ordenar"
                    defaultValue={filters.ordenar}
                    className="w-full bg-slate-950/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none [&>option]:bg-slate-900 [&>option]:text-white [&>option]:py-2"
                  >
                    {ORDENAR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-slate-900 text-white font-medium py-2">
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Aplicar Filtros
                </button>
                {hasFilters && (
                  <a
                    href="/subastas"
                    className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-white/5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpiar Filtros
                  </a>
                )}
              </div>
            </form>
          </aside>

          {/* ─── Lots Grid ────────────────────────────────────────────────────── */}
          <main className="flex-1">
            {lotes.length === 0 ? (
              <div className="bg-card border border-white/8 rounded-2xl p-12 text-center shadow-xl">
                <p className="text-4xl mb-4">📦</p>
                <h3 className="text-white font-bold text-xl mb-2">Sin Resultados de Subastas</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  No encontramos lotes que coincidan con los criterios aplicados. Intenta ajustar el rango de precios o seleccionar otra categoría.
                </p>
                <a
                  href="/subastas"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ver Todos los Lotes Disponibles
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {lotes.map((lote) => (
                  <LoteCard key={lote.id} lote={lote} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
