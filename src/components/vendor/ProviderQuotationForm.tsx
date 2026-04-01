'use client';

/**
 * ProviderQuotationForm — Formulario de cotización desglosada
 * Permite al proveedor cotizar servicios y logística por item/línea
 * con cálculo automático de subtotales.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Trash2,
    Send,
    Package,
    Truck,
    Loader2,
    DollarSign,
} from 'lucide-react';
import { formatCLP } from '@/lib/quotation-fsm';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface ProviderItem {
    id: string;
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
}

interface QuotationInfo {
    id: string;
    code: string;
    brief: string;
    eventStartDate?: string;
    eventLocation?: string;
    eventAddress?: string;
    eventTime?: string;
    setupTime?: string;
    teardownTime?: string;
    eventEndTime?: string;
    technicalVisit?: boolean;
    clientName?: string;
    requestedItems?: { itemName: string; quantity: number }[];
}

interface ProviderQuotationFormProps {
    quotation: QuotationInfo;
    onSuccess: () => void;
}

// ============================================
// Helpers
// ============================================

let itemCounter = 0;
function nextId(): string {
    itemCounter += 1;
    return `item-${Date.now()}-${itemCounter}`;
}

const DEFAULT_LOGISTICS_CONCEPTS = [
    'Transporte Ida',
    'Transporte Vuelta',
    'Viáticos Personal',
    'Visita Técnica',
    'Horas Extra (nocturno)',
];

// ============================================
// Component
// ============================================

export function ProviderQuotationForm({ quotation, onSuccess }: ProviderQuotationFormProps) {
    const [serviceItems, setServiceItems] = useState<ProviderItem[]>([
        { id: nextId(), category: 'SERVICIO', concept: '', quantity: 1, unitPriceNet: 0 },
    ]);
    const [logisticsItems, setLogisticsItems] = useState<ProviderItem[]>([
        { id: nextId(), category: 'LOGISTICA', concept: DEFAULT_LOGISTICS_CONCEPTS[0] || '', quantity: 1, unitPriceNet: 0 },
    ]);
    const [notes, setNotes] = useState('');
    const [deliveryDays, setDeliveryDays] = useState('3');
    const [submitting, setSubmitting] = useState(false);

    // --- Computed ---
    const subtotalServices = serviceItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceNet,
        0
    );
    const subtotalLogistics = logisticsItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceNet,
        0
    );
    const totalProviderNet = subtotalServices + subtotalLogistics;

    // --- Item CRUD ---
    function addServiceItem() {
        setServiceItems((prev) => [
            ...prev,
            { id: nextId(), category: 'SERVICIO', concept: '', quantity: 1, unitPriceNet: 0 },
        ]);
    }

    function addLogisticsItem(concept = '') {
        setLogisticsItems((prev) => [
            ...prev,
            { id: nextId(), category: 'LOGISTICA', concept, quantity: 1, unitPriceNet: 0 },
        ]);
    }

    function removeItem(id: string, type: 'SERVICIO' | 'LOGISTICA') {
        if (type === 'SERVICIO') {
            setServiceItems((prev) => prev.filter((item) => item.id !== id));
        } else {
            setLogisticsItems((prev) => prev.filter((item) => item.id !== id));
        }
    }

    function updateItem(
        id: string,
        type: 'SERVICIO' | 'LOGISTICA',
        field: keyof ProviderItem,
        value: string | number
    ) {
        const setter = type === 'SERVICIO' ? setServiceItems : setLogisticsItems;
        setter((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    }

    // --- Submit ---
    async function handleSubmit() {
        // Validate
        const allItems = [...serviceItems, ...logisticsItems];
        if (allItems.length === 0) {
            toast.error('Debe agregar al menos un item');
            return;
        }

        // Validar concepto y precio por cada item
        for (const item of allItems) {
            const label = item.category === 'SERVICIO' ? 'Servicio' : 'Logística';
            if (!item.concept || !item.concept.trim()) {
                toast.error(`${label}: Falta el concepto / descripción`);
                return;
            }
            if (typeof item.unitPriceNet !== 'number' || item.unitPriceNet <= 0) {
                toast.error(`${label} "${item.concept}": debe tener un precio > 0`);
                return;
            }
        }

        if (serviceItems.length === 0) {
            toast.error('Debe incluir al menos un servicio');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                items: allItems.map((item) => ({
                    category: item.category,
                    concept: item.concept.trim(),
                    quantity: item.quantity,
                    unitPriceNet: item.unitPriceNet,
                })),
                providerNotes: notes.trim() || undefined,
                deliveryDays: Number(deliveryDays) || 0,
            };

            const response = await fetch(`/api/quotations/${quotation.id}/provider-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error enviando cotización');
            }

            toast.success('Cotización enviada al administrador');
            onSuccess();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }

    // --- Render ---
    return (
        <div className="space-y-6">
            {/* Event Info Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        📋 Información del Evento — {quotation.code}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                    {quotation.eventStartDate && (
                        <div>
                            <span className="text-muted-foreground">Fecha:</span>{' '}
                            <span className="font-medium">
                                {new Date(quotation.eventStartDate).toLocaleDateString('es-CL')}
                            </span>
                        </div>
                    )}
                    {(quotation.eventLocation || quotation.eventAddress) && (
                        <div>
                            <span className="text-muted-foreground">Dirección:</span>{' '}
                            <span className="font-medium">
                                {quotation.eventAddress || quotation.eventLocation}
                            </span>
                        </div>
                    )}
                    {quotation.setupTime && (
                        <div>
                            <span className="text-muted-foreground">Montaje:</span>{' '}
                            <span className="font-medium">{quotation.setupTime}</span>
                        </div>
                    )}
                    {quotation.eventTime && (
                        <div>
                            <span className="text-muted-foreground">Evento:</span>{' '}
                            <span className="font-medium">{quotation.eventTime}</span>
                        </div>
                    )}
                    {quotation.teardownTime && (
                        <div>
                            <span className="text-muted-foreground">Desmontaje:</span>{' '}
                            <span className="font-medium">{quotation.teardownTime}</span>
                        </div>
                    )}
                    {quotation.technicalVisit && (
                        <div>
                            <Badge variant="outline" className="text-blue-600">Visita Técnica: Sí</Badge>
                        </div>
                    )}
                    <div className="col-span-full">
                        <span className="text-muted-foreground">Descripción:</span>
                        <p className="mt-1 text-foreground">{quotation.brief}</p>
                    </div>

                    {/* Requested Items */}
                    {quotation.requestedItems && quotation.requestedItems.length > 0 && (
                        <div className="col-span-full">
                            <span className="text-muted-foreground font-medium">📦 Items Solicitados:</span>
                            <ul className="mt-1 list-disc list-inside">
                                {quotation.requestedItems.map((ri, i) => (
                                    <li key={i}>
                                        {ri.itemName} × {ri.quantity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Service Items */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Package className="h-5 w-5 text-blue-500" />
                            Servicios / Equipamiento
                        </CardTitle>
                        <Badge variant="secondary">{formatCLP(subtotalServices)}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Header row */}
                    <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                        <div className="col-span-5">Concepto</div>
                        <div className="col-span-2 text-center">Cant.</div>
                        <div className="col-span-3 text-right">Valor Neto Unit.</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1"></div>
                    </div>

                    {serviceItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <Input
                                className="col-span-5"
                                placeholder="Ej: Pendón Led P 1.8"
                                value={item.concept}
                                onChange={(e) => updateItem(item.id, 'SERVICIO', 'concept', e.target.value)}
                            />
                            <Input
                                className="col-span-2 text-center"
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                    updateItem(item.id, 'SERVICIO', 'quantity', parseInt(e.target.value) || 1)
                                }
                            />
                            <div className="col-span-3 relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-7 text-right"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={item.unitPriceNet || ''}
                                    onChange={(e) =>
                                        updateItem(item.id, 'SERVICIO', 'unitPriceNet', parseInt(e.target.value) || 0)
                                    }
                                />
                            </div>
                            <div className="col-span-1 text-right text-sm font-medium">
                                {formatCLP(item.quantity * item.unitPriceNet)}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="col-span-1"
                                onClick={() => removeItem(item.id, 'SERVICIO')}
                                disabled={serviceItems.length <= 1}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    <Button variant="outline" size="sm" onClick={addServiceItem} className="w-full">
                        <Plus className="h-4 w-4 mr-1" /> Agregar Línea
                    </Button>
                </CardContent>
            </Card>

            {/* Logistics Items */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Truck className="h-5 w-5 text-amber-500" />
                            Logística
                        </CardTitle>
                        <Badge variant="neutral">{formatCLP(subtotalLogistics)}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                        <div className="col-span-7">Concepto</div>
                        <div className="col-span-3 text-right">Valor Neto</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-1"></div>
                    </div>

                    {logisticsItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <Input
                                className="col-span-7"
                                placeholder="Ej: Transporte Ida"
                                value={item.concept}
                                onChange={(e) => updateItem(item.id, 'LOGISTICA', 'concept', e.target.value)}
                            />
                            <div className="col-span-3 relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-7 text-right"
                                    type="number"
                                    min={0}
                                    placeholder="0"
                                    value={item.unitPriceNet || ''}
                                    onChange={(e) =>
                                        updateItem(item.id, 'LOGISTICA', 'unitPriceNet', parseInt(e.target.value) || 0)
                                    }
                                />
                            </div>
                            <div className="col-span-1 text-right text-sm font-medium">
                                {formatCLP(item.unitPriceNet)}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="col-span-1"
                                onClick={() => removeItem(item.id, 'LOGISTICA')}
                                disabled={logisticsItems.length <= 1}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    <Button variant="outline" size="sm" onClick={() => addLogisticsItem()} className="w-full">
                        <Plus className="h-4 w-4 mr-1" /> Agregar Concepto
                    </Button>

                    {/* Quick-add logistics suggestions */}
                    <div className="flex flex-wrap gap-1 pt-2">
                        {DEFAULT_LOGISTICS_CONCEPTS.filter(
                            (concept) => !logisticsItems.some((i) => i.concept === concept)
                        ).map((concept) => (
                            <Button
                                key={concept}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => addLogisticsItem(concept)}
                            >
                                + {concept}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Notes & Delivery */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Nota para el Administrador (opcional)
                            </label>
                            <Textarea
                                className="mt-2"
                                placeholder="Ej: Se requiere generador eléctrico adicional por horario nocturno..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                maxLength={500}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                Días para Entrega / Montaje
                            </label>
                            <Input
                                className="mt-2"
                                type="number"
                                min={0}
                                value={deliveryDays}
                                onChange={(e) => setDeliveryDays(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Totals + Submit */}
            <Card className="border-2 border-primary/30">
                <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal Servicios NETO:</span>
                        <span className="font-medium">{formatCLP(subtotalServices)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal Logística NETO:</span>
                        <span className="font-medium">{formatCLP(subtotalLogistics)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL PROVEEDOR NETO:</span>
                        <span className="text-primary">{formatCLP(totalProviderNet)}</span>
                    </div>

                    <Button
                        className="w-full mt-4"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting || totalProviderNet <= 0}
                    >
                        {submitting ? (
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5 mr-2" />
                        )}
                        Enviar Cotización al Administrador
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
