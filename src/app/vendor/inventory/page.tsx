import { Metadata } from 'next';
import { UserRole } from '@/core/domain/auth/UserRole';
import InventoryDashboard from './components/InventoryDashboard';
import InventoryTable from './components/InventoryTable';
import AddItemModal from './components/AddItemModal';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { redirect } from 'next/navigation';
import { 
    fetchProviderProfileByUserId, 
    fetchProviderInventory, 
    fetchInventoryStats, 
    fetchCatalogForInventory 
} from '@/infrastructure/http/server-data/serverFetch';

export const metadata: Metadata = {
    title: 'Mi Inventario | Dropservice Vendor',
    description: 'Gestiona tus equipos y servicios para recibir solicitudes de cotización.',
};

export default async function InventoryPage() {
    const session = await getServerSession();

    if (!session || session.role !== UserRole.VENDOR) {
        redirect('/login');
    }

    const profile = await fetchProviderProfileByUserId(session.userId);

    if (!profile) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No se encontró un perfil de proveedor asociado a esta cuenta.
            </div>
        );
    }

    const [items, stats, catalogItems] = await Promise.all([
        fetchProviderInventory(profile.id),
        fetchInventoryStats(profile.id),
        fetchCatalogForInventory()
    ]);

    // IDs de ítems que ya están en el inventario del proveedor
    const existingItemIds = items.map((i: any) => i.item_id);

    // Mapear items para que el cliente los entienda (si es necesario)
    const normalizedItems = items.map((i: any) => ({
        id: i.id,
        itemId: i.item_id,
        providerId: i.provider_id,
        costPerUnit: i.cost_per_unit,
        availableQuantity: i.available_quantity,
        isAvailable: i.is_available,
        notes: i.notes,
        equipmentCondition: i.equipment_condition,
        status: i.status || 'active',
        minRentalDays: i.min_rental_days || 1,
        advanceBookingDays: i.advance_booking_days || 0,
        // eslint-disable-next-line react-hooks/purity
        createdAt: new Date(i.created_at || Date.now()),
        // eslint-disable-next-line react-hooks/purity
        updatedAt: new Date(i.updated_at || Date.now())
    }));

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Mi Inventario</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Declara tus equipos y servicios para que el motor de matching te asigne RFPs.
                    </p>
                </div>
                <AddItemModal
                    providerId={profile.id}
                    catalogItems={catalogItems}
                    existingItemIds={existingItemIds}
                />
            </div>

            <InventoryDashboard stats={{ ...stats, averageCost: stats.averageCost || 0 }} />

            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-foreground">Ítems Registrados</h2>
                </div>
                <InventoryTable items={normalizedItems} providerId={profile.id} />
            </div>
        </div>
    );
}
