'use client';

import { useState } from 'react';
import { FileText, Download, X, CheckCircle, Package } from 'lucide-react';
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
    { id: 1, sku: 'SKU-99412', descripcion: `${retailerOrigen} Premium Unit - Pack A`, cantidad: 12, condicion: 'Nuevo', msrpUnit: 45000 },
    { id: 2, sku: 'SKU-88231', descripcion: `${retailerOrigen} Selected Item - Pack B`, cantidad: 8, condicion: 'Como Nuevo', msrpUnit: 68000 },
    { id: 3, sku: 'SKU-77519', descripcion: `${retailerOrigen} Standard Stock Unit`, cantidad: 15, condicion: 'Nuevo', msrpUnit: 29000 },
    { id: 4, sku: 'SKU-66304', descripcion: `${retailerOrigen} Clearance Accessories`, cantidad: 25, condicion: 'Caja Abierta', msrpUnit: 15000 },
  ];

  const handleDownload = () => {
    // Simulated CSV download trigger
    const blob = new Blob(
      [
        `SKU,Descripción,Cantidad,Condición,MSRP Unitario CLP\n` +
          manifestItems.map((i) => `"${i.sku}","${i.descripcion}",${i.cantidad},"${i.condicion}",${i.msrpUnit}`).join('\n'),
      ],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Manifiesto_${loteNumero}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer"
        type="button"
      >
        <FileText className="w-4 h-4" />
        Ver / Descargar Manifiesto PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Manifiesto de Inventario</h3>
                  <p className="text-xs text-muted-foreground">Lote N° {loteNumero} — {retailerOrigen}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Información del Manifiesto</div>
                  <div className="text-white text-sm font-medium mt-0.5">{tituloLote}</div>
                  {msrpTotal && (
                    <div className="text-xs text-muted-foreground mt-1">
                      MSRP Retail Total Estimado: <span className="text-amber-300 font-semibold">{CLPFormatter.format(msrpTotal)}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl transition-all shadow-md flex-shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar CSV / PDF
                </button>
              </div>

              {/* Manifest Items Table */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  Detalle de Artículos Incluidos
                </h4>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-muted-foreground">
                    <thead className="bg-white/5 text-white uppercase text-[10px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">SKU / Item</th>
                        <th className="py-3 px-4">Descripción</th>
                        <th className="py-3 px-4 text-center">Cant.</th>
                        <th className="py-3 px-4">Condición</th>
                        <th className="py-3 px-4 text-right">MSRP Unitario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {manifestItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-amber-300">{item.sku}</td>
                          <td className="py-3 px-4 text-white font-medium">{item.descripcion}</td>
                          <td className="py-3 px-4 text-center text-white">{item.cantidad}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              {item.condicion}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white font-medium">
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
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
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
