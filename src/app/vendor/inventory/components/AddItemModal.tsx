'use client';

import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { addInventoryItemAction } from '@/actions/inventory';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface CatalogItemForModal {
    id: string;
    name: string;
    categoryName: string;
    itemType: string;
    priceSuggested: number | null;
    priceReferenceMin: number | null;
    priceReferenceMax: number | null;
    unitLabel: string;
}

interface Props {
    providerId: string;
    catalogItems: CatalogItemForModal[];
    existingItemIds: string[];
}

export default function AddItemModal({ providerId, catalogItems, existingItemIds }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<CatalogItemForModal | null>(null);
    const [costPerUnit, setCostPerUnit] = useState<string>('');

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val);

    const availableItems = useMemo(() =>
        catalogItems.filter(item =>
            !existingItemIds.includes(item.id) &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [catalogItems, existingItemIds, searchTerm]
    );

    const handleSelectItem = (item: CatalogItemForModal) => {
        setSelectedItem(item);
        setCostPerUnit(item.priceSuggested?.toString() || '');
    };

    const handleAdd = async () => {
        if (!selectedItem) return;
        const cost = parseInt(costPerUnit, 10);
        if (isNaN(cost) || cost < 0) {
            toast.error('Ingresa un costo válido');
            return;
        }

        setLoading(true);
        const result = await addInventoryItemAction({
            providerId,
            itemId: selectedItem.id,
            costPerUnit: cost,
            notes: selectedItem.name,
            isAvailable: true,
            status: 'ACTIVE'
        });

        if (result.success) {
            toast.success(`${selectedItem.name} agregado al inventario`);
            setSelectedItem(null);
            setCostPerUnit('');
            setSearchTerm('');
            setOpen(false);
        } else {
            toast.error(result.error || 'Error al agregar ítem');
        }
        setLoading(false);
    };

    const handleBack = () => {
        setSelectedItem(null);
        setCostPerUnit('');
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedItem(null); setSearchTerm(''); } }}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Ítem
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle>
                        {selectedItem ? 'Configurar Costo' : 'Agregar al Inventario'}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedItem
                            ? `Define tu costo neto para "${selectedItem.name}".`
                            : 'Selecciona un ítem del catálogo maestro para ofrecerlo.'}
                    </DialogDescription>
                </DialogHeader>

                {!selectedItem ? (
                    <>
                        <div className="relative my-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en el catálogo maestro..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
                            {availableItems.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm py-8">
                                    {searchTerm ? 'No se encontraron ítems.' : 'Todos los ítems ya están en tu inventario.'}
                                </div>
                            )}
                            {availableItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">{item.categoryName}</span>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                {item.itemType}
                                            </Badge>
                                        </div>
                                        {item.priceSuggested && (
                                            <span className="text-xs text-green-600 font-medium">
                                                Ref: {formatCurrency(item.priceSuggested)} / {item.unitLabel}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="space-y-5 py-2">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                            <div className="font-semibold text-sm">{selectedItem.name}</div>
                            <div className="text-xs text-muted-foreground">{selectedItem.categoryName} · {selectedItem.itemType}</div>
                            {(selectedItem.priceReferenceMin || selectedItem.priceReferenceMax) && (
                                <div className="text-xs text-blue-600 mt-1">
                                    Rango de mercado: {selectedItem.priceReferenceMin ? formatCurrency(selectedItem.priceReferenceMin) : '—'} – {selectedItem.priceReferenceMax ? formatCurrency(selectedItem.priceReferenceMax) : '—'}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cost-input" className="text-sm font-medium">
                                Tu costo neto por {selectedItem.unitLabel}
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                                <Input
                                    id="cost-input"
                                    type="number"
                                    min={0}
                                    className="pl-8"
                                    placeholder="0"
                                    value={costPerUnit}
                                    onChange={(e) => setCostPerUnit(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Este es el precio que cobras sin IVA. La plataforma aplicará su margen sobre este valor.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                ← Volver
                            </Button>
                            <Button
                                onClick={handleAdd}
                                disabled={loading || !costPerUnit}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Agregar al Inventario
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
