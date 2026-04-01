import { redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchAdminLeadsAction } from '@/actions/admin-leads';
import { AdminLeadsClient } from './AdminLeadsClient';
import { UserRole } from '@/core/domain/auth/UserRole';

export default async function AdminLeadsPage() {
  const session = await getServerSession();
  
  // Verificación de seguridad básica para el administrador
  if (!session || session.role !== UserRole.ADMIN) {
    redirect('/login');
  }

  const result = await fetchAdminLeadsAction();

  if (!result.success) {
    // Podríamos renderizar un componente de error específico aquí
    return (
      <div className="p-8 text-destructive border border-destructive/20 bg-destructive/5 rounded-lg">
        <h2 className="text-xl font-bold">Error al cargar leads</h2>
        <p className="mt-2 text-sm">{result.error}</p>
      </div>
    );
  }

  return <AdminLeadsClient leads={result.leads || []} />;
}
