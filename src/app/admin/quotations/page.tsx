/**
 * Admin Quotations Page — RSC (Server Component)
 * Optimized with direct server fetching.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchAdminQuotations } from '@/infrastructure/http/server-data/serverFetch';
import { AdminQuotationsClient } from './AdminQuotationsClient';
import { UserRole } from '@/core/domain/auth/UserRole';

export default async function AdminQuotationsPage() {
    const session = await getServerSession();
    if (!session || session.role !== UserRole.ADMIN) redirect('/login');

    const quotations = await fetchAdminQuotations();
    
    // Map to compat format
    const legacyQuotations = quotations.map(q => ({
        ...q,
        service: { name: q.serviceName },
        client: q.clientName ? { name: q.clientName, email: '' } : null,
        assignedProvider: q.providerName ? { name: q.providerName } : null
    }));

    return <AdminQuotationsClient quotations={legacyQuotations as any} />;
}
