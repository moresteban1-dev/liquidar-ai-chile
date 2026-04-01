import { redirect, notFound } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { createClient } from '@/lib/supabase/server';
import { SupabaseQuoteSessionRepository } from '@/infrastructure/persistence/supabase/repositories/SupabaseQuoteSessionRepository';
import { LeadDetailClient } from './LeadDetailClient';
import { UserRole } from '@/core/domain/auth/UserRole';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const session = await getServerSession();
  const { id } = await params;

  if (!session || session.role !== UserRole.ADMIN) {
    redirect('/login');
  }

  const supabase = await createClient();
  const repo = new SupabaseQuoteSessionRepository(supabase);
  
  const result = await repo.findById(id);

  if (result.isFailure()) {
    const errorMessage = result.getError().message;
    return (
      <div className="p-8 text-destructive border border-destructive/20 bg-destructive/5 rounded-lg">
        <h2 className="text-xl font-bold">Error al cargar el lead</h2>
        <p className="mt-2 text-sm">{errorMessage}</p>
      </div>
    );
  }

  const lead = result.getValue();
  if (!lead) {
    notFound();
  }

  // Serializar para el cliente
  const serializedLead = JSON.parse(JSON.stringify(lead));

  return <LeadDetailClient lead={serializedLead} />;
}
