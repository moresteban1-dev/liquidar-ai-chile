/**
 * Admin Orders Page — RSC (Server Component)
 * Fetches orders server-side and passes to interactive client component.
 * Eliminates useEffect waterfall for instant data on first paint.
 */

import { getAdminOrders } from '@/actions/orders';
import { AdminOrdersClient } from './AdminOrdersClient';

export default async function AdminOrdersPage() {
    const orders = await getAdminOrders();
    return <AdminOrdersClient orders={orders} />;
}
