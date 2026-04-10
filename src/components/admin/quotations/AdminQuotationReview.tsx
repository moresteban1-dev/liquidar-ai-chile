'use client';

/**
 * AdminQuotationReview — Panel de revisión y comisión
 * El admin ve el desglose del proveedor, agrega comisión,
 * reformula líneas para el cliente, y envía la cotización.
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Plus,
    Trash2,
    Send,
    RotateCcw,
    Eye,
    Loader2,
    Package,
    Truck,
    Calculator,
    DollarSign,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { predictPriceAction } from '@/actions/pricing-actions';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import {
    formatCLP,
    calculateCommission,
    CommissionMethod,
    CommissionResult,
} from '@/lib/quotation-fsm';
import { toast } from 'sonner';
import { DownloadQuoteButton } from '@/components/quotations/DownloadQuoteButton';
import { Quotation } from '@/lib/types';
import { TAX_CONFIG } from '@domain/pricing/TaxConfig'

// ============================================
// Types
// ============================================

interface ProviderItem {
    id: string;
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: number;
    totalPriceNet: number;
}

interface ClientLine {
    localId: string;
    description: string;
    quantity: number;
    unitPriceNet: number;
}

interface QuotationDetail {
    id: string;
    code: string;
    brief: string;
    status: string;
    clientName?: string | undefined;
    providerName?: string | undefined;
    eventStartDate?: string | undefined;
    eventLocation?: string | undefined;
    providerNotes?: string | undefined;
    subtotalServicesProvider: number;
    subtotalLogisticsProvider: number;
    providerItems: ProviderItem[];
}

interface AdminQuotationReviewProps {
    quotation: QuotationDetail;
    onSuccess: () => void;
    onReturn: () => void;
}

// ============================================
// Helpers
// ============================================

let lineCounter = 0;
function nextLineId(): string {
    lineCounter += 1;
    return `line-${Date.now()}-${lineCounter}`;
}

const METHOD_OPTIONS: { value: CommissionMethod; label: string }[] = [
    { value: 'PORCENTAJE', label: 'Porcentaje Global' },
    { value: 'PORCENTAJE_CATEGORIA', label: 'Porcentaje por Categoría' },
    { value: 'MONTO_FIJO', label: 'Monto Fijo' },
    { value: 'MIXTO', label: 'Mixto' },
];

// ============================================
// Component
// ============================================

export function AdminQuotationReview({ quotation, onSuccess, onReturn }: AdminQuotationReviewProps) {
    // Commission Method State
    const [method, setMethod] = useState<CommissionMethod>('PORCENTAJE');
    const [globalPct, setGlobalPct] = useState(50);
    const [servicesPct, setServicesPct] = useState(50);
    const [logisticsPct, setLogisticsPct] = useState(30);
    const [fixedServices, setFixedServices] = useState(0);
    const [fixedLogistics, setFixedLogistics] = useState(0);
    const [validDays, setValidDays] = useState(7);

    // Client Lines State
    const [clientLines, setClientLines] = useState<ClientLine[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // AI Prediction State
    const [aiInsight, setAiInsight] = useState<{
        suggestedPrice: number;
        confidenceScore: number;
        isSecure: boolean;
        reasoning: string;
    } | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);

    // Initialize client lines from provider items (auto-reformulate)
    useEffect(() => {
        if (clientLines.length === 0 && quotation.providerItems?.length > 0) {
            const initialLines = quotation.providerItems.map((pi) => ({
                localId: nextLineId(),
                description: pi.concept,
                quantity: pi.quantity,
                unitPriceNet: 0, // Will be filled after commission calc
            }));
            setClientLines(initialLines);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotation.providerItems]);

    // --- AI Insight Fetching ---
    useEffect(() => {
        async function getAIInsight() {
            if (!quotation.id) return;
            setLoadingAI(true);
            try {
                // Mocking historical data based on current quotation for demonstration
                // In production, the service handles fetching real history
                const result = await predictPriceAction({
                    serviceId: quotation.id,
                    historicalCosts: [quotation.subtotalServicesProvider],
                    historicalPrices: [quotation.subtotalServicesProvider * 1.5],
                    complexity: 'MEDIUM'
                });

                if (result.success && result.data) {
                    setAiInsight(result.data);
                }
            } catch (err) {
                logger.error('Failed to get AI Insight', err);
            } finally {
                setLoadingAI(false);
            }
        }
        getAIInsight();
    }, [quotation.id, quotation.subtotalServicesProvider]);

    // --- Computed Commission ---
    const commissionResult: CommissionResult = useMemo(() => {
        return calculateCommission({
            method,
            subtotalServicesProvider: quotation.subtotalServicesProvider,
            subtotalLogisticsProvider: quotation.subtotalLogisticsProvider,
            globalPercentage: globalPct,
            servicesPercentage: servicesPct,
            logisticsPercentage: logisticsPct,
            fixedCommissionServices: fixedServices,
            fixedCommissionLogistics: fixedLogistics,
        });
    }, [method, globalPct, servicesPct, logisticsPct, fixedServices, fixedLogistics, quotation]);

    // Client lines total
    const clientLinesTotal = clientLines.reduce(
        (sum, line) => sum + line.quantity * line.unitPriceNet,
        0
    );
    const clientIva = Math.round(clientLinesTotal * TAX_CONFIG.IVA_RATE);
    const clientTotalWithIva = clientLinesTotal + clientIva;

    // --- Client Line CRUD ---
    function addClientLine() {
        setClientLines((prev) => [
            ...prev,
            { localId: nextLineId(), description: '', quantity: 1, unitPriceNet: 0 },
        ]);
    }

    function removeClientLine(id: string) {
        setClientLines((prev) => prev.filter((l) => l.localId !== id));
    }

    function updateClientLine(id: string, field: keyof ClientLine, value: string | number) {
        setClientLines((prev) =>
            prev.map((l) => (l.localId === id ? { ...l, [field]: value } : l))
        );
    }

    // --- Auto-generate client lines from commission ---
    function autoGenerateClientLines() {
        const totalProviderNet = quotation.subtotalServicesProvider + quotation.subtotalLogisticsProvider;
        if (totalProviderNet <= 0) return;

        // Distribute commission proportionally across provider items
        const ratio = commissionResult.totalNet / totalProviderNet;

        const generated = quotation.providerItems.map((pi) => ({
            localId: nextLineId(),
            description: pi.concept,
            quantity: pi.quantity,
            unitPriceNet: Math.round(pi.unitPriceNet * ratio),
        }));

        setClientLines(generated);
        toast.info('Líneas generadas automáticamente con comisión incluida');
    }

    // --- Submit ---
    async function handleSubmit() {
        if (clientLines.length === 0) {
            toast.error('Debe agregar al menos una línea para el cliente');
            return;
        }

        for (const line of clientLines) {
            if (!line.description || !line.description.trim()) {
                toast.error('Todas las líneas deben tener descripción');
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                commissionMethod: method,
                globalPercentage: globalPct,
                servicesPercentage: servicesPct,
                logisticsPercentage: logisticsPct,
                fixedCommissionServices: fixedServices,
                fixedCommissionLogistics: fixedLogistics,
                clientItems: clientLines.map((l) => ({
                    description: l.description ? l.description.trim() : '',
                    quantity: l.quantity,
                    unitPriceNet: l.unitPriceNet,
                })),
                validDays,
            };

            const response = await fetch(`/api/quotations/${quotation.id}/commission`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error aplicando comisión');
            }

            toast.success('Cotización enviada al cliente');
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
            {/* === SECTION 1: Provider Breakdown === */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        📦 Desglose del Proveedor — {quotation.code}
                    </CardTitle>
                    {quotation.providerNotes && (
                        <p className="text-sm text-muted-foreground mt-1">
                            <strong>Nota del proveedor:</strong> {quotation.providerNotes}
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    {/* Services */}
                    {quotation.providerItems.filter((i) => i.category === 'SERVICIO').length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                                <Package className="h-4 w-4 text-blue-500" /> Servicios
                            </h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-muted-foreground border-b">
                                        <th className="text-left p-2">Concepto</th>
                                        <th className="text-center p-2">Cant.</th>
                                        <th className="text-right p-2">Unitario NETO</th>
                                        <th className="text-right p-2">Total NETO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation.providerItems
                                        .filter((i) => i.category === 'SERVICIO')
                                        .map((item) => (
                                            <tr key={item.id} className="border-b border-border/50">
                                                <td className="p-2">{item.concept}</td>
                                                <td className="p-2 text-center">{item.quantity}</td>
                                                <td className="p-2 text-right">{formatCLP(item.unitPriceNet)}</td>
                                                <td className="p-2 text-right font-medium">{formatCLP(item.totalPriceNet)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            <div className="text-right text-sm font-semibold mt-2 text-blue-600">
                                Subtotal Servicios: {formatCLP(quotation.subtotalServicesProvider)}
                            </div>
                        </div>
                    )}

                    {/* Logistics */}
                    {quotation.providerItems.filter((i) => i.category === 'LOGISTICA').length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                                <Truck className="h-4 w-4 text-amber-500" /> Logística
                            </h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-muted-foreground border-b">
                                        <th className="text-left p-2">Concepto</th>
                                        <th className="text-right p-2">Valor NETO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation.providerItems
                                        .filter((i) => i.category === 'LOGISTICA')
                                        .map((item) => (
                                            <tr key={item.id} className="border-b border-border/50">
                                                <td className="p-2">{item.concept}</td>
                                                <td className="p-2 text-right font-medium">{formatCLP(item.totalPriceNet)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            <div className="text-right text-sm font-semibold mt-2 text-amber-600">
                                Subtotal Logística: {formatCLP(quotation.subtotalLogisticsProvider)}
                            </div>
                        </div>
                    )}

                    <hr className="my-4" />
                    <div className="text-right text-lg font-bold">
                        Total Proveedor NETO: {formatCLP(commissionResult.totalProviderNet)}
                    </div>
                </CardContent>
            </Card>

            {/* === SECTION 2: Commission Configuration === */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-primary" />
                            Comisión de la Plataforma
                        </CardTitle>
                        {loadingAI ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 animate-pulse">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Analizando con IA...
                            </div>
                        ) : aiInsight && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                aiInsight.isSecure ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                                <Sparkles className="h-3 w-3" />
                                {aiInsight.isSecure ? 'Margen Seguro (IA)' : 'Revisar Margen (IA)'}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* AI Reasoning Widget */}
                    {aiInsight && (
                        <div className="p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-md shadow-sm">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Análisis de Pricing Oracle</p>
                                    <p className="text-sm text-purple-800 leading-relaxed italic">&quot;{aiInsight.reasoning}&quot;</p>
                                    <div className="flex gap-4 pt-1">
                                        <div className="flex items-center gap-1">
                                            {aiInsight.isSecure ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                                            <span className="text-[10px] font-medium text-slate-500">Confianza: {Math.round(aiInsight.confidenceScore * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Method Selector */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Método</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                            {METHOD_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={method === opt.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setMethod(opt.value)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Method-specific inputs */}
                    {method === 'PORCENTAJE' && (
                        <div className="flex items-center gap-3">
                            <label className="text-sm w-40">Porcentaje Global:</label>
                            <Input
                                type="number"
                                className="w-32"
                                value={globalPct}
                                onChange={(e) => setGlobalPct(parseInt(e.target.value) || 0)}
                                min={0}
                                max={200}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                        </div>
                    )}

                    {method === 'PORCENTAJE_CATEGORIA' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="text-sm w-40 flex items-center gap-1">
                                    <Package className="h-4 w-4 text-blue-500" /> Servicios:
                                </label>
                                <Input
                                    type="number"
                                    className="w-32"
                                    value={servicesPct}
                                    onChange={(e) => setServicesPct(parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={200}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm w-40 flex items-center gap-1">
                                    <Truck className="h-4 w-4 text-amber-500" /> Logística:
                                </label>
                                <Input
                                    type="number"
                                    className="w-32"
                                    value={logisticsPct}
                                    onChange={(e) => setLogisticsPct(parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={200}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                            </div>
                        </div>
                    )}

                    {(method === 'MONTO_FIJO' || method === 'MIXTO') && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <label className="text-sm w-40">Comisión Servicios:</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="w-48 pl-7"
                                        value={fixedServices}
                                        onChange={(e) => setFixedServices(parseInt(e.target.value) || 0)}
                                        min={0}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm w-40">Comisión Logística:</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        className="w-48 pl-7"
                                        value={fixedLogistics}
                                        onChange={(e) => setFixedLogistics(parseInt(e.target.value) || 0)}
                                        min={0}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Commission Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Comisión Servicios:</span>
                            <span className="font-medium text-blue-600">{formatCLP(commissionResult.commissionServicesNet)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Comisión Logística:</span>
                            <span className="font-medium text-amber-600">{formatCLP(commissionResult.commissionLogisticsNet)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                            <span>Total Comisión NETO:</span>
                            <span className="text-primary">{formatCLP(commissionResult.totalCommissionNet)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm">Válida por:</label>
                        <Input
                            type="number"
                            className="w-24"
                            value={validDays}
                            onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                            min={1}
                            max={90}
                        />
                        <span className="text-sm text-muted-foreground">días</span>
                    </div>
                </CardContent>
            </Card>

            {/* === SECTION 3: Client Lines (Reformulation) === */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">✏️ Líneas para el Cliente</CardTitle>
                        <Button variant="outline" size="sm" onClick={autoGenerateClientLines}>
                            <RotateCcw className="h-4 w-4 mr-1" /> Auto-generar con comisión
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Estas líneas son las que verá el cliente. Puedes reformular conceptos y ajustar precios.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                        <div className="col-span-5">Descripción</div>
                        <div className="col-span-2 text-center">Cant.</div>
                        <div className="col-span-3 text-right">Valor Neto Unit.</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1"></div>
                    </div>

                    {clientLines.map((line) => (
                        <div key={line.localId} className="grid grid-cols-12 gap-2 items-center">
                            <Input
                                className="col-span-5"
                                placeholder="Concepto para el cliente"
                                value={line.description}
                                onChange={(e) => updateClientLine(line.localId, 'description', e.target.value)}
                            />
                            <Input
                                className="col-span-2 text-center"
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) =>
                                    updateClientLine(line.localId, 'quantity', parseInt(e.target.value) || 1)
                                }
                            />
                            <div className="col-span-3 relative">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-7 text-right"
                                    type="number"
                                    min={0}
                                    value={line.unitPriceNet || ''}
                                    onChange={(e) =>
                                        updateClientLine(line.localId, 'unitPriceNet', parseInt(e.target.value) || 0)
                                    }
                                />
                            </div>
                            <div className="col-span-1 text-right text-sm font-medium">
                                {formatCLP(line.quantity * line.unitPriceNet)}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="col-span-1"
                                onClick={() => removeClientLine(line.localId)}
                                disabled={clientLines.length <= 1}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}

                    <Button variant="outline" size="sm" onClick={addClientLine} className="w-full">
                        <Plus className="h-4 w-4 mr-1" /> Agregar Línea
                    </Button>
                </CardContent>
            </Card>

            {/* === SECTION 4: Preview + Actions === */}
            <Card className="border-2 border-green-500/30">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-500" />
                        Lo que verá el Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal NETO:</span>
                        <span className="font-medium">{formatCLP(clientLinesTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA 19%:</span>
                        <span className="font-medium">{formatCLP(clientIva)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-xl font-bold">
                        <span>TOTAL:</span>
                        <span className="text-green-600">{formatCLP(clientTotalWithIva)}</span>
                    </div>

                    {/* PDF Preview Button */}
                    <div className="py-2">
                        <DownloadQuoteButton
                            quotation={{
                                ...quotation,
                                service: { name: quotation.brief.substring(0, 50), description: quotation.brief }, // Fallback
                                priceNet: clientLinesTotal,
                                priceIva: clientIva,
                                priceTotal: clientTotalWithIva,
                                issuedAt: new Date(),
                                // Mock branding props if needed
                            } as unknown as Quotation}
                            clientItems={clientLines.map(l => ({
                                description: l.description,
                                quantity: l.quantity,
                                unit_price_net: l.unitPriceNet,
                                total_price_net: l.quantity * l.unitPriceNet
                            }))}
                            label="Previsualizar PDF"
                            className="w-full"
                        />
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                            <span>Costo proveedor:</span>
                            <span>{formatCLP(commissionResult.totalProviderNet)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Comisión plataforma:</span>
                            <span>{formatCLP(commissionResult.totalCommissionNet)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span>Margen:</span>
                            <span>
                                {commissionResult.totalProviderNet > 0
                                    ? `${Math.round((commissionResult.totalCommissionNet / commissionResult.totalProviderNet) * 100)}%`
                                    : '0%'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onReturn}
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Devolver al Proveedor
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={submitting || clientLines.length === 0}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-1" />
                            )}
                            Enviar al Cliente
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
