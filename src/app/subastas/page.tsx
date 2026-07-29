import type { Metadata } from 'next';
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

  const hasFilters = !!(filters.categoria || filters.precioMin || filters.precioMax || filters.region);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Subastas Activas
          </h1>
          <p className="text-muted-foreground">
            {lotes.length} lote{lotes.length !== 1 ? 's' : ''} disponible{lotes.length !== 1 ? 's' : ''}
            {hasFilters && (
              <span className="ml-2 text-amber-400 text-sm font-medium">— filtrado</span>
            )}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Sidebar Filters ───────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <form method="GET" className="bg-card border border-white/8 rounded-2xl p-5 space-y-5 sticky top-24">
              <h2 className="text-white font-semibold text-sm">Filtros</h2>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoría</label>
                <select
                  name="categoria"
                  defaultValue={filters.categoria ?? ''}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Todas</option>
                  {(Object.entries(CATEGORIA_LABELS) as [CategoriaLote, string][]).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Región */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Región</label>
                <select
                  name="region"
                  defaultValue={filters.region ?? ''}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Todas las regiones</option>
                  {REGIONES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio mínimo (CLP)</label>
                <input
                  type="number"
                  name="precioMin"
                  defaultValue={filters.precioMin}
                  placeholder="$0"
                  min={0}
                  step={10000}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio máximo (CLP)</label>
                <input
                  type="number"
                  name="precioMax"
                  defaultValue={filters.precioMax}
                  placeholder="Sin límite"
                  min={0}
                  step={10000}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Ordenar */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordenar por</label>
                <select
                  name="ordenar"
                  defaultValue={filters.ordenar}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {ORDENAR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  Aplicar filtros
                </button>
                {hasFilters && (
                  <a
                    href="/subastas"
                    className="block w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white font-medium rounded-lg text-sm text-center transition-colors"
                  >
                    Limpiar filtros
                  </a>
                )}
              </div>
            </form>
          </aside>

          {/* ─── Lots Grid ────────────────────────────────────────────────────── */}
          <main className="flex-1">
            {lotes.length === 0 ? (
              <div className="bg-card border border-white/8 rounded-2xl p-12 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-white font-semibold text-lg mb-2">Sin resultados</h3>
                <p className="text-muted-foreground mb-4">
                  No hay lotes que coincidan con tus filtros.
                </p>
                <a href="/subastas" className="text-amber-400 hover:text-amber-300 transition-colors text-sm">
                  Ver todos los lotes
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
