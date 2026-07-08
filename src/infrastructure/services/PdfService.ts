import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuotationDTO, QuotationProviderItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { formatCLP } from '@/lib/quotation-fsm';
import { COMPANY_CONFIG } from '@/config/company-config';

// Defines the Item structure for the PDF (Client-facing view)
// Matches the API response from /api/quotations/[id]/client-items
export interface PdfClientItem {
    description: string;
    quantity: number;
    unit_price_net: number;
    total_price_net: number;
}

export class PdfService {

    constructor() {
        // Services instances are created per method call to ensure thread safety and fresh state
    }

    public generateQuotationPdf(quotation: QuotationDTO, items: PdfClientItem[]): void {
        // Reset doc for each generation to avoid appending pages if singleton is reused improperly
        // However, constructor is called once. 
        // Better pattern: Create a new doc instance per call or method variable.
        // But for this simple singleton, let's just re-instantiate or clear.
        // Actually, reusing the same instance for multiple downloads is bad.
        // Let's change the pattern to create instance inside the method or generic class.

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = COMPANY_CONFIG.PDF.MARGIN;
        let currentY = 15;

        // --- Header ---
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.TITLE);
        doc.text('COTIZACIÓN', pageWidth - margin, currentY, { align: 'right' });

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_MUTED);
        doc.text(quotation.code || 'N/A', pageWidth - margin, currentY + 6, { align: 'right' });

        // Logo Placeholder (Text for now)
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SUBTITLE);
        doc.text(COMPANY_CONFIG.IDENTITY.NAME, margin, currentY);
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_MUTED);
        doc.text(COMPANY_CONFIG.IDENTITY.TAGLINE, margin, currentY + 5);
        doc.text(COMPANY_CONFIG.CONTACT.EMAIL, margin, currentY + 10);

        currentY += 25;

        // --- Client Info ---
        doc.setDrawColor(200);
        doc.setFillColor(...COMPANY_CONFIG.PDF.COLORS.CLIENT_INFO_FILL);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 35, 'FD');

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SECTION_HEADER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        const labelX = Number(margin + 5);
        const labelY = Number(currentY + 8);
        (doc as any).text('Información del Cliente', labelX, labelY);

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_SECONDARY);
        // Left Column
        // Handle potentially missing client name
        const clientName = quotation.client?.name || 'Cliente';
        doc.text(`Solicitado por: ${clientName}`, margin + 5, currentY + 16);

        const dateStr = quotation.issuedAt
            ? formatDate(typeof quotation.issuedAt === 'string' ? quotation.issuedAt : new Date(quotation.issuedAt).toISOString())
            : formatDate(new Date().toISOString());
        doc.text(`Fecha Emisión: ${dateStr}`, margin + 5, currentY + 22);

        // Right Column
        const midPoint = margin + ((pageWidth - (margin * 2)) / 2);
        if (quotation.eventLocation) {
            doc.text(`Ubicación: ${quotation.eventLocation}`, midPoint, currentY + 16);
        }
        if (quotation.eventStartDate) {
            const startDateStr = typeof quotation.eventStartDate === 'string' ? quotation.eventStartDate : new Date(quotation.eventStartDate).toISOString();
            doc.text(`Fecha Evento: ${formatDate(startDateStr)}`, midPoint, currentY + 22);
        }

        currentY += 45;

        // --- Description ---
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SECTION_HEADER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        doc.text('Detalle del Servicio', margin, currentY);
        currentY += 5;
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_SECONDARY);

        const splitDesc = doc.splitTextToSize(quotation.service?.name || 'Servicio General', pageWidth - (margin * 2));
        doc.text(splitDesc, margin, currentY);
        currentY += (splitDesc.length * 5) + 5;

        // --- Table ---
        const tableHeaders = [['Ítem', 'Cant.', 'Precio Unit.', 'Total']];
        const tableBody = items.map(item => [
            item.description,
            item.quantity.toString(),
            formatCLP(item.unit_price_net),
            formatCLP(item.total_price_net)
        ]);

        autoTable(doc, {
            startY: currentY,
            head: tableHeaders,
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: [...COMPANY_CONFIG.PDF.COLORS.CLIENT_HEADER],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: COMPANY_CONFIG.PDF.FONT_SIZE.BODY,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Description gets auto width
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        // @ts-expect-error - jspdf types mismatch for lastAutoTable
        currentY = doc.lastAutoTable.finalY + 10;

        // --- Totals ---
        const totalsX = pageWidth - margin - 60;

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_SECONDARY);
        doc.text('Subtotal Neto:', totalsX, currentY);
        doc.text(formatCLP(quotation.priceNet || 0), pageWidth - margin, currentY, { align: 'right' });

        currentY += 6;
        doc.text(COMPANY_CONFIG.TAX.IVA_LABEL + ':', totalsX, currentY);
        doc.text(formatCLP(quotation.priceIva || 0), pageWidth - margin, currentY, { align: 'right' });

        currentY += 8;
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SUBTITLE);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', totalsX, currentY);

        const totalStr = String(formatCLP(quotation.priceTotal || 0));
        doc.text(totalStr, pageWidth - margin, currentY, { align: 'right' });

        // --- Bank Details (Show if Approved/Awaiting Payment) ---
        if (quotation.status === 'APPROVED' || quotation.publicStatus === 'APPROVED' || quotation.status === 'AWAITING_CLIENT_PAYMENT') {
            currentY += 20;

            // Check for page break
            if (currentY + 40 > pageHeight) {
                doc.addPage();
                currentY = 20;
            }

            doc.setDrawColor(...COMPANY_CONFIG.PDF.COLORS.BANK_BORDER);
            doc.setFillColor(...COMPANY_CONFIG.PDF.COLORS.BANK_FILL);
            doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 35, 3, 3, 'FD');

            doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
            doc.setTextColor(...COMPANY_CONFIG.PDF.COLORS.BANK_TEXT);
            doc.text('Datos de Transferencia', margin + 5, currentY + 8);

            doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
            doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_SECONDARY);

            doc.text(`Banco: ${COMPANY_CONFIG.BANK.BANK_NAME}`, margin + 5, currentY + 16);
            doc.text(`Tipo: ${COMPANY_CONFIG.BANK.ACCOUNT_TYPE}`, margin + 5, currentY + 22);
            doc.text(`Nº: ${COMPANY_CONFIG.BANK.ACCOUNT_NUMBER}`, margin + 60, currentY + 16);
            doc.text(`RUT: ${COMPANY_CONFIG.IDENTITY.RUT}`, margin + 60, currentY + 22);
            doc.text(`Mail: ${COMPANY_CONFIG.CONTACT.PAYMENTS_EMAIL}`, margin + 5, currentY + 28);
        }

        // --- Footer ---
        const footerY = pageHeight - 10;
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.FOOTER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_LIGHT);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString();
        const footerStr = `Generado el ${today} | ${COMPANY_CONFIG.IDENTITY.NAME}`;
        doc.text(footerStr, margin, footerY);

        // Save
        doc.save(`Cotizacion-${quotation.code}.pdf`);
    }

    public generateProviderQuotationPdf(quotation: QuotationDTO, providerItems: QuotationProviderItem[]): void {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = COMPANY_CONFIG.PDF.MARGIN;
        let currentY = 15;

        // --- Header ---
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.TITLE);
        doc.text('COTIZACIÓN DE PROVEEDOR', pageWidth - margin, currentY, { align: 'right' });

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_MUTED);
        doc.text(quotation.code || 'N/A', pageWidth - margin, currentY + 6, { align: 'right' });

        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SUBTITLE);
        doc.text('Desglose de Costos de Servicio', margin, currentY);

        currentY += 25;

        // --- Event Info (No Client Name) ---
        doc.setDrawColor(200);
        doc.setFillColor(...COMPANY_CONFIG.PDF.COLORS.PROVIDER_INFO_FILL);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 35, 'FD');

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SECTION_HEADER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        (doc as any).text('Detalles del Requerimiento', margin + 5, currentY + 8);

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.BODY);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_SECONDARY);

        const dateStr = quotation.issuedAt
            ? formatDate(typeof quotation.issuedAt === 'string' ? quotation.issuedAt : new Date(quotation.issuedAt).toISOString())
            : formatDate(new Date().toISOString());
        doc.text(`Fecha Emisión: ${dateStr}`, margin + 5, currentY + 16);

        if (quotation.service) {
            doc.text(`Servicio: ${quotation.service.name}`, margin + 5, currentY + 22);
        }

        const midPoint = margin + ((pageWidth - (margin * 2)) / 2);
        if (quotation.eventLocation) {
            doc.text(`Ubicación: ${quotation.eventLocation}`, midPoint, currentY + 16);
        }
        if (quotation.eventStartDate) {
            const startDateStr = typeof quotation.eventStartDate === 'string' ? quotation.eventStartDate : new Date(quotation.eventStartDate).toISOString();
            doc.text(`Fecha Evento: ${formatDate(startDateStr)}`, midPoint, currentY + 22);
        }

        currentY += 45;

        // --- Table ---
        const tableHeaders = [['Categoría', 'Concepto', 'Cant.', 'Costo Unit. (Neto)', 'Total (Neto)']];
        const tableBody = providerItems.map(item => {
            const unitPrice = item.unitPriceNet ?? (item as any).unit_price_net;
            const totalPrice = item.totalPriceNet ?? (item as any).total_price_net;
            return [
                item.category,
                item.concept,
                item.quantity.toString(),
                formatCLP(unitPrice),
                formatCLP(totalPrice)
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: tableHeaders,
            body: tableBody,
            theme: 'striped',
            headStyles: {
                fillColor: [...COMPANY_CONFIG.PDF.COLORS.PROVIDER_HEADER],
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: COMPANY_CONFIG.PDF.FONT_SIZE.BODY,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: margin, right: margin }
        });

        // @ts-expect-error - jspdf types mismatch for lastAutoTable
        currentY = doc.lastAutoTable.finalY + 15;

        // --- Totals ---
        const totalsX = pageWidth - margin - 60;

        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.SECTION_HEADER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_PRIMARY);
        doc.setFont('helvetica', 'bold');
        doc.text('COSTO TOTAL NETO:', totalsX, currentY);

        const totalCost = providerItems.reduce((acc, item) => {
            const totalPrice = item.totalPriceNet ?? (item as any).total_price_net;
            return acc + (Number(totalPrice) || 0);
        }, 0);
        doc.text(formatCLP(totalCost), pageWidth - margin, currentY, { align: 'right' });

        // --- Footer ---
        const footerY = pageHeight - 10;
        doc.setFontSize(COMPANY_CONFIG.PDF.FONT_SIZE.FOOTER);
        doc.setTextColor(COMPANY_CONFIG.PDF.COLORS.TEXT_LIGHT);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString();
        doc.text(`Generado el ${today} | Confidencial - Solo Proveedor`, margin, footerY);

        // Save
        doc.save(`Presupuesto-${quotation.code}.pdf`);
    }
}

export const pdfService = new PdfService();
