/**
 * Client Quotations Page — RSC (Server Component)
 * Fetches data server-side and passes to interactive client component.
 */

import { getClientQuotations } from '@/actions/quotations';
import { ClientQuotationsClient } from './ClientQuotationsClient';

export default async function ClientQuotationsPage() {
    const quotations = await getClientQuotations();
    return <ClientQuotationsClient quotations={quotations} />;
}
