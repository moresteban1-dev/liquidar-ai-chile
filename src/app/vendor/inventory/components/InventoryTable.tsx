'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit2, Search } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ProviderInventoryItem } from '@core/domain/provider/ProviderInventoryTypes';
import { toggleInventoryAvailabilityAction, deleteInventoryItemAction } from '@/actions/inventory';
import { toast } from 'sonner';

interface Props {
    items: ProviderInventoryItem[];
    providerId: string;
}

 
export default function InventoryTable({ items, providerId: _providerId }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = async (id: string, current: boolean) => {
        const result = await toggleInventoryAvailabilityAction(id, !current);
        if (result.success) {
            toast.success('Disponibilidad actualizada');
        } else {
            toast.error('Error al actualizar disponibilidad');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este ítem de tu inventario?')) return;
        const result = await deleteInventoryItemAction(id);
        if (result.success) {
            toast.success('Ítem eliminado');
        } else {
            toast.error('Error al eliminar ítem');
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar en tu inventario..."
                    className="pl-10 max-w-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Ítem ID / Ref</TableHead>
                            <TableHead>Costo Base</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Condición</TableHead>
                            <TableHead>Disponibilidad</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{item.itemId.slice(0, 8)}...</span>
                                        <span className="text-xs text-muted-foreground">{item.notes || 'Sin notas'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{formatCurrency(item.costPerUnit)}</TableCell>
                                <TableCell>
                                    {item.availableQuantity === null ? (
                                        <Badge variant="outline">Ilimitado</Badge>
                                    ) : (
                                        <span className="font-semibold">{item.availableQuantity}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.equipmentCondition ? (
                                        <Badge variant="secondary">{item.equipmentCondition}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={item.isAvailable}
                                        onCheckedChange={() => handleToggle(item.id, item.isAvailable)}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredItems.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No se encontraron ítems.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
