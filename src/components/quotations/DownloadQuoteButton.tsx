'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import type { PdfClientItem } from '@core/application/services/PdfService';
import { QuotationDTO, QuotationProviderItem } from '@/lib/types';
import { toast } from 'sonner';

interface DownloadQuoteButtonProps {
    quotation: QuotationDTO;
    clientItems?: PdfClientItem[];
    providerItems?: QuotationProviderItem[];
    format?: 'CLIENT' | 'PROVIDER';
    className?: string;
    label?: string;
}

export function DownloadQuoteButton({
    quotation,
    clientItems = [],
    providerItems = [],
    format = 'CLIENT',
    className,
    label = 'Descargar PDF'
}: DownloadQuoteButtonProps) {
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        setGenerating(true);
        try {
            // Lazy load the PDF package to keep it out of the Main Thread early rendering!
            const { pdfService } = await import('@core/application/services/PdfService');

            if (format === 'PROVIDER') {
                let itemsToPrint = providerItems;
                if (itemsToPrint.length === 0) {
                    try {
                        const res = await fetch(`/api/quotations/${quotation.id}/provider-items`);
                        if (res.ok) {
                            itemsToPrint = await res.json();
                        }
                    } catch (err) {
                        logger.warn('Could not fetch provider items for PDF', { error: String(err) });
                    }
                }

                // Fallback for providers
                if (itemsToPrint.length === 0) {
                    itemsToPrint = [{
                        id: '1',
                        quotationId: quotation.id,
                        category: 'SERVICIO',
                        concept: quotation.service?.name || 'Servicio General',
                        quantity: 1,
                        unitPriceNet: quotation.priceCost || 0,
                        totalPriceNet: quotation.priceCost || 0,
                        sortOrder: 1
                    }];
                }

                pdfService.generateProviderQuotationPdf(quotation, itemsToPrint);
                toast.success('Presupuesto Proveedor descargado');
            } else {
                let itemsToPrint = clientItems;

                // Client Flow
                if (itemsToPrint.length === 0) {
                    try {
                        const res = await fetch(`/api/quotations/${quotation.id}/client-items`);
                        if (res.ok) {
                            itemsToPrint = await res.json();
                        }
                    } catch {
                        logger.warn('Could not fetch items for PDF, using fallback');
                    }
                }

                // Fallback if still empty
                if (itemsToPrint.length === 0) {
                    itemsToPrint = [{
                        description: quotation.service?.name || 'Servicio de Eventos',
                        quantity: 1,
                        unit_price_net: quotation.priceNet || 0,
                        total_price_net: quotation.priceNet || 0
                    }];
                }

                pdfService.generateQuotationPdf(quotation, itemsToPrint);
                toast.success('PDF descargado');
            }
        } catch (error) {
            logger.error('Error generating PDF:', error);
            toast.error('Error al generar el PDF');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={generating}
            className={className}
        >
            {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileDown className="mr-2 h-4 w-4" />
            )}
            {generating ? 'Generando...' : label}
        </Button>
    );
}
