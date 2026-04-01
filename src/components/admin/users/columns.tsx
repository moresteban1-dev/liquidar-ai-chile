'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { toast } from 'sonner';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/ui/advanced-data-table';

import { deleteUser, toggleUserBan } from '@/actions/users';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { UserEditDialog } from './user-edit-dialog';
import { UserRole, normalizeRole } from '@/core/domain/auth/UserRole';

// This type mirrors the profile structure + auth data
export type UserProfile = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone: string | null;
    created_at: string;
    is_active?: boolean;
    last_sign_in_at?: string;
};

const UserActions = ({ user }: { user: UserProfile }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) return;

        setLoading(true);
        try {
            const result = await deleteUser(user.id);
            if (result.success) {
                toast.success('Usuario eliminado correctamente');
                router.refresh();
            } else {
                toast.error('Error al eliminar usuario: ' + result.error);
            }
        } catch (error: unknown) {
            logger.error(error instanceof Error ? error.message : String(error));
            toast.error('Error inesperado al eliminar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleBan = async () => {
        const action = user.is_active ? 'banear' : 'desbanear';
        if (!confirm(`¿Estás seguro de que quieres ${action} a este usuario?`)) return;

        setLoading(true);
        try {
            const result = await toggleUserBan(user.id, { shouldBan: !!user.is_active });
            if (result.success) {
                toast.success(`Usuario ${action === 'banear' ? 'baneado' : 'desbaneado'} correctamente`);
                router.refresh();
            } else {
                toast.error(`Error al ${action} usuario: ` + result.error);
            }
        } catch (error: unknown) {
            logger.error(error instanceof Error ? error.message : String(error));
            toast.error(`Error inesperado al ${action} usuario`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <UserEditDialog
                user={user}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                        <span className="sr-only">Abrir menú</span>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(user.id)}
                    >
                        Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        Editar Usuario
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBan}>
                        {user.is_active ? 'Banear / Suspender' : 'Activar / Desbanear'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={handleDelete}
                    >
                        Eliminar Usuario
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const columns: ColumnDef<UserProfile>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                        {row.getValue('name') || 'Sin Nombre'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {user.last_sign_in_at ? `Último acceso: ${new Date(user.last_sign_in_at).toLocaleDateString()}` : 'Nunca accedió'}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Rol" />
        ),
        cell: ({ row }) => {
            const role = normalizeRole(row.getValue('role') as string);
            let variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'info' | 'warning' = 'outline';

            if (role === UserRole.ADMIN) variant = 'destructive';
            if (role === UserRole.VENDOR) variant = 'info';
            if (role === UserRole.CLIENT) variant = 'success';

            return <Badge variant={variant}>{role}</Badge>;
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id));
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Estado',
        cell: ({ row }) => {
            const isActive = row.original.is_active;
            return (
                <Badge variant={isActive ? 'success' : 'secondary'} className={isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                    {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: ({ row }) => row.getValue('phone') || '-',
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Registrado" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return new Intl.DateTimeFormat('es-CL', {
                dateStyle: 'medium',
            }).format(date);
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => <UserActions user={row.original} />,
    },
];
