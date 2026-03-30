// ============================================================
// components/checkout/ManualTransferForm.tsx
// ============================================================

'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react';
import { BankAccountData } from '@/types/payments';
import { Copy, Check, Upload, Building2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    bankData: BankAccountData;
    paymentId: string;
    amount: number;
    orderId: string;
    onReceiptUploaded: () => void;
}

export function ManualTransferForm({
    bankData, paymentId, amount, orderId, onReceiptUploaded
}: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        sender_name: '',
        sender_rut: '',
        sender_bank: '',
        transfer_date: '',
    });
    const [uploading, setUploading] = useState(false);

    function copyToClipboard(text: string, field: string) {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('receipt', file);
            uploadFormData.append('payment_id', paymentId);
            uploadFormData.append('sender_name', formData.sender_name);
            uploadFormData.append('sender_rut', formData.sender_rut);
            uploadFormData.append('sender_bank', formData.sender_bank);
            uploadFormData.append('transfer_date', formData.transfer_date);

            const res = await fetch('/api/payments/manual/upload-receipt', {
                method: 'POST',
                body: uploadFormData,
            });

            if (!res.ok) throw new Error('Error al subir comprobante');

            onReceiptUploaded();
        } catch (error) {
            logger.error(error);
            alert('Error al subir el comprobante');
        } finally {
            setUploading(false);
        }
    }

    const bankFields = [
        { label: 'Banco', value: bankData.bank_name, key: 'bank' },
        { label: 'Tipo de cuenta', value: bankData.account_type, key: 'type' },
        { label: 'Nº de cuenta', value: bankData.account_number, key: 'number' },
        { label: 'Titular', value: bankData.holder_name, key: 'holder' },
        { label: 'RUT', value: bankData.holder_rut, key: 'rut' },
        { label: 'Email', value: bankData.holder_email, key: 'email' },
    ];

    return (
        <div className="space-y-6">
            {/* Monto a transferir */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600">Monto a transferir</p>
                <p className="text-3xl font-bold text-blue-900">
                    ${amount.toLocaleString('es-CL')}
                </p>
                <p className="text-xs text-blue-500 mt-1">
                    Orden #{orderId.slice(0, 8).toUpperCase()}
                </p>
            </div>

            {/* Datos bancarios */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-800">
                        Datos para transferencia
                    </h4>
                </div>
                <div className="divide-y">
                    {bankFields.map((field) => (
                        <div
                            key={field.key}
                            className="flex items-center justify-between px-4 py-3"
                        >
                            <div>
                                <p className="text-xs text-gray-500">{field.label}</p>
                                <p className="font-medium text-gray-900">{field.value}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(field.value, field.key)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Copiar"
                            >
                                {copied === field.key ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Nota importante */}
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                    {bankData.additional_notes}
                </p>
            </div>

            {/* Formulario de comprobante */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-semibold text-gray-800">
                    Datos de la transferencia
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del titular
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.sender_name}
                            onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            RUT
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="12.345.678-9"
                            value={formData.sender_rut}
                            onChange={(e) => setFormData({ ...formData, sender_rut: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Banco de origen
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.sender_bank}
                            onChange={(e) => setFormData({ ...formData, sender_bank: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de transferencia
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.transfer_date}
                            onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Upload comprobante */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comprobante de transferencia
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6
                          text-center hover:border-blue-400 transition-colors">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="receipt-upload"
                            required
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            {file ? (
                                <p className="text-sm text-blue-600 font-medium">{file.name}</p>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Arrastra o haz clic para subir
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        PNG, JPG o PDF (máx. 5MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        'Enviar comprobante'
                    )}
                </button>
            </form>
        </div>
    );
}
