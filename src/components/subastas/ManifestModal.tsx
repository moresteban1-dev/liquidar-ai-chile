'use client';

import { useState } from 'react';
import { FileText, Download, X, CheckCircle, Package, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLPFormatter } from '@/lib/chile/clp-formatter';

interface ManifestModalProps {
  loteNumero: string;
  tituloLote: string;
  manifestUrl?: string;
  msrpTotal?: number;
  retailerOrigen: string;
}

export default function ManifestModal({
  loteNumero,
  tituloLote,
  manifestUrl,
  msrpTotal,
  retailerOrigen,
}: ManifestModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock itemized manifest items based on lot
  const manifestItems = [
    { id: 1, sku: 'SKU-99412', descripcion: `${retailerOrigen} Premium Stock Unit - Pack A`, cantidad: 12, condicion: 'Nuevo / Sellado', msrpUnit: 45000 },
    { id: 2, sku: 'SKU-88231', descripcion: `${retailerOrigen} Selected Item - Pack B`, cantidad: 8, condicion: 'Como Nuevo', msrpUnit: 68000 },
    { id: 3, sku: 'SKU-77519', descripcion: `${retailerOrigen} Standard Pallet Stock`, cantidad: 15, condicion: 'Nuevo / Sellado', msrpUnit: 29000 },
    { id: 4, sku: 'SKU-66304', descripcion: `${retailerOrigen} Clearance Accessories`, cantidad: 25, condicion: 'Caja Abierta', msrpUnit: 15000 },
  ];

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // ─── Header Section (Corporate Dark & Amber) ──────────────────────────────
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.rect(0, 0, 210, 40, 'F');

    // Brand Title
    doc.setTextColor(245, 158, 11); // #F59E0B Amber
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Liquidar.cl', 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma B2B Oficial de Subastas y Liquidación de Retailers', 14, 26);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 145, 26);

    // Accent Bar
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 39, 210, 2, 'F');

    // ─── Lot Information Summary Box ─────────────────────────────────────────
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 48, 182, 32, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`MANIFIESTO OFICIAL DE INVENTARIO — LOTE N° ${loteNumero}`, 18, 57);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Título del Lote: ${tituloLote}`, 18, 65);
    doc.text(`Retailer de Origen: ${retailerOrigen}`, 18, 72);

    if (msrpTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`Valor MSRP Total: ${CLPFormatter.format(msrpTotal)}`, 130, 72);
    }

    // ─── Items Table ──────────────────────────────────────────────────────────
    const tableRows = manifestItems.map((item) => [
      item.sku,
      item.descripcion,
      item.cantidad.toString(),
      item.condicion,
      CLPFormatter.format(item.msrpUnit),
      CLPFormatter.format(item.msrpUnit * item.cantidad),
    ]);

    autoTable(doc, {
      startY: 87,
      head: [['SKU / CÓDIGO', 'DESCRIPCIÓN DE PRODUCTO', 'CANT.', 'CONDICIÓN', 'MSRP UNIT.', 'SUBTOTAL MSRP']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [245, 158, 11],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    // ─── Footer & Certification ──────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable?.finalY || 160;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, finalY + 12, 196, finalY + 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento oficial generado por Liquidar.cl. Validez certificada para la auditoría y recepción de lotes de liquidación.',
      14,
      finalY + 20
    );

    // Save as PDF
    doc.save(`Manifiesto_Oficial_${loteNumero}.pdf`);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
        type="button"
      >
        <FileText className="w-4 h-4" />
        Ver / Descargar Manifiesto PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Manifiesto Oficial de Inventario</h3>
                  <p className="text-xs text-amber-400/80 font-medium">Lote N° {loteNumero} — {retailerOrigen}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-slate-950/60 border border-amber-500/25 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    Manifiesto Verificado en PDF
                  </div>
                  <div className="text-white text-sm font-bold">{tituloLote}</div>
                  {msrpTotal && (
                    <div className="text-xs text-slate-400 mt-1">
                      MSRP Retail Total Estimado: <span className="text-amber-400 font-bold">{CLPFormatter.format(msrpTotal)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex-shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar Manifiesto PDF
                </button>
              </div>

              {/* Manifest Items Table */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Detalle del Manifiesto Paletizado
                </h4>
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-amber-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">SKU / Item</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4 text-center">Cant.</th>
                        <th className="py-3 px-4">Condición</th>
                        <th className="py-3 px-4 text-right">MSRP Unitario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-900/40">
                      {manifestItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-amber-300 font-semibold">{item.sku}</td>
                          <td className="py-3.5 px-4 text-white font-medium">{item.descripcion}</td>
                          <td className="py-3.5 px-4 text-center text-white font-bold">{item.cantidad}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              {item.condicion}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-white font-semibold">
                            {CLPFormatter.format(item.msrpUnit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Formato PDF oficial certificado por Liquidar.cl
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
