/**
 * Vendor Quotations Page — RSC (Server Component)
 * Optimized with direct server fetching.
 */

import { redirect } from 'next/navigation';
import { UserRole } from '@/core/domain/auth/UserRole';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchProviderQuotations } from '@/infrastructure/http/server-data/serverFetch';
import { VendorQuotationsClient } from './VendorQuotationsClient';

export default async function VendorQuotationsPage() {
    const session = await getServerSession();
    if (!session || session.role !== UserRole.VENDOR) redirect('/login');

    const quotations = await fetchProviderQuotations(session.userId);
    
    // Map to compat format
    const legacyQuotations = quotations.map(q => ({
        ...q,
        service: { name: q.serviceName },
        priceTotal: null as number | null
    }));

    return <VendorQuotationsClient quotations={legacyQuotations as any} />;
}
