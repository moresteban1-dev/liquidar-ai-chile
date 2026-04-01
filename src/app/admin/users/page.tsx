import { getUsers } from '@/actions/users';
import { columns } from '@/components/admin/users/columns';
import { AdvancedDataTable } from '@/components/ui/advanced-data-table';
import { UserRole } from '@/core/domain/auth/UserRole';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    // 🚀 Server-side fetching (O(1) TTI)
    const data = await getUsers();

    // Column Filters definition
    const facetedFilters = [
        {
            column: 'role',
            title: 'Rol',
            options: [
                { label: 'Cliente', value: UserRole.CLIENT },
                { label: 'Proveedor', value: UserRole.VENDOR },
                { label: 'Admin', value: UserRole.ADMIN },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Usuarios</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de usuarios y roles del sistema.</p>
            </div>

            <AdvancedDataTable
                data={data}
                columns={columns}
                filterColumn="email"
                filterPlaceholder="Buscar por email..."
                facetedFilters={facetedFilters}
            />
        </div>
    );
}
