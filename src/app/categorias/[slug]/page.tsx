import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLotesByCategoria } from '@/lib/chile/mock-lotes';
import { CATEGORIA_LABELS } from '@/types/liquidar';
import type { CategoriaLote } from '@/types/liquidar';
import LoteCard from '@/components/subastas/LoteCard';

const VALID_CATEGORIAS = Object.keys(CATEGORIA_LABELS) as CategoriaLote[];

interface CategoriaPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return VALID_CATEGORIAS.map((c) => ({ slug: c }));
}

export async function generateMetadata({ params }: CategoriaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const label = CATEGORIA_LABELS[slug as CategoriaLote];
  if (!label) return { title: 'Categoría no encontrada' };
  return {
    title: `${label} — Subastas Liquidar Chile`,
    description: `Encuentra lotes de ${label} de Falabella, Ripley, Paris y más retailers chilenos. Compra con hasta 80% de descuento.`,
  };
}

export default async function CategoriaPage({ params }: CategoriaPageProps) {
  const { slug } = await params;

  if (!VALID_CATEGORIAS.includes(slug as CategoriaLote)) {
    notFound();
  }

  const categoria = slug as CategoriaLote;
  const label = CATEGORIA_LABELS[categoria];
  const lotes = getLotesByCategoria(categoria);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <a href="/" className="hover:text-white transition-colors">Inicio</a>
          <span>/</span>
          <a href="/subastas" className="hover:text-white transition-colors">Subastas</a>
          <span>/</span>
          <span className="text-white">{label}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{label}</h1>
          <p className="text-muted-foreground">
            {lotes.length} lote{lotes.length !== 1 ? 's' : ''} disponible{lotes.length !== 1 ? 's' : ''} en esta categoría
          </p>
        </div>

        {/* Grid */}
        {lotes.length === 0 ? (
          <div className="bg-card border border-white/8 rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">📦</p>
            <h2 className="text-white font-semibold text-lg mb-2">Sin lotes disponibles</h2>
            <p className="text-muted-foreground mb-4">Actualmente no hay lotes en esta categoría. Pronto habrá nuevos.</p>
            <a href="/subastas" className="text-amber-400 hover:text-amber-300 transition-colors text-sm">
              Ver todas las subastas
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {lotes.map((lote) => (
              <LoteCard key={lote.id} lote={lote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
