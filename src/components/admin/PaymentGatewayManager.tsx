// ============================================================
// components/admin/PaymentGatewayManager.tsx
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { PaymentGateway } from '@/types/payments';
import { Loader2, Settings, ToggleLeft, ToggleRight, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentGatewayManager() {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [configForm, setConfigForm] = useState<Record<string, unknown>>({});
    const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchGateways();
    }, []);

    async function fetchGateways() {
        try {
            const res = await fetch('/api/admin/payment-gateways');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Fallo desconocido al obtener pasarelas');
            }

            setGateways(data.gateways || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || 'Error cargando gateways desde API');
        } finally {
            setLoading(false);
        }
    }

    async function toggleGateway(id: string, currentState: boolean) {
        try {
            // Optimistic update
            setGateways(gws => gws.map(gw =>
                gw.id === id ? { ...gw, is_active: !currentState } : gw
            ));

            const res = await fetch('/api/admin/payment-gateways', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gateway_id: id, is_active: !currentState }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Falló al actualizar');
            }

            toast.success(`Gateway ${!currentState ? 'activado' : 'desactivado'}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // Revert
            setGateways(gws => gws.map(gw =>
                gw.id === id ? { ...gw, is_active: currentState } : gw
            ));
            toast.error(error.message || 'Error al cambiar estado');
        }
    }

    function startEditing(gw: PaymentGateway) {
        setEditingId(gw.id);
        // Deep copy config
        setConfigForm(JSON.parse(JSON.stringify(gw.config)));
    }

    async function saveConfig(id: string) {
        try {
            const res = await fetch('/api/admin/payment-gateways', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gateway_id: id, config: configForm }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Falló al guardar');
            }

            toast.success('Configuración guardada');
            setEditingId(null);
            fetchGateways(); // Actualizar para obtener nuevas versiones (si cambiaron)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar configuración');
        }
    }

    if (loading) return <div className="flex p-8 justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" /> Pasarelas de Pago
            </h2>

            <div className="grid gap-5">
                {gateways.map((gw) => (
                    <div key={gw.id} className="bg-white dark:bg-slate-800/80 backdrop-blur-sm p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600/50">
                                    <span className="font-bold text-slate-600 dark:text-slate-300 text-lg">{gw.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{gw.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono opacity-80">{gw.slug}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleGateway(gw.id, gw.is_active)}
                                    className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center w-12 h-12 ${gw.is_active
                                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                            : 'text-slate-400 bg-slate-50 hover:bg-slate-100 dark:text-slate-500 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 grayscale opacity-80 hover:grayscale-0 hover:opacity-100'
                                        }`}
                                    title={gw.is_active ? "Desactivar Pasarela" : "Activar Pasarela"}
                                >
                                    {gw.is_active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                </button>
                                <button
                                    onClick={() => editingId === gw.id ? setEditingId(null) : startEditing(gw)}
                                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${editingId === gw.id
                                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20'
                                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20'
                                        }`}
                                >
                                    {editingId === gw.id ? 'Cerrar' : 'Configurar'}
                                </button>
                            </div>
                        </div>

                        {editingId === gw.id && (
                            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5 mt-5 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                                {Object.keys(configForm).length === 0 ? (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                                        No hay parámetros configurables para esta pasarela.
                                    </div>
                                ) : (
                                    Object.entries(configForm).map(([key, value]) => {
                                        const isSecret = key.includes('token') || key.includes('key') || key.includes('secret');
                                        return (
                                            <div key={key} className="space-y-1.5 flex flex-col">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase ml-1">
                                                    {key.replace(/_/g, ' ')}
                                                </label>
                                                <div className="relative group">
                                                    {/* Usamos textarea si parece ser instrucciones multilínea */}
                                                    {key === 'instructions' || (typeof value === 'string' && value.length > 50) ? (
                                                        <textarea
                                                            value={value as string}
                                                            onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.value })}
                                                            rows={4}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-y"
                                                            placeholder={`Ingresar ${key.replace(/_/g, ' ')}`}
                                                        />
                                                    ) : (
                                                        <>
                                                            <input
                                                                type={isSecret && !showSecret[key] ? "password" : "text"}
                                                                value={value as string}
                                                                onChange={(e) => setConfigForm({ ...configForm, [key]: e.target.value })}
                                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 pr-12"
                                                                placeholder={`Ingresar ${key.replace(/_/g, ' ')}`}
                                                            />
                                                            {isSecret && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowSecret(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-transparent dark:hover:bg-slate-700 rounded-md transition-colors"
                                                                >
                                                                    {showSecret[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div className="flex justify-end pt-3">
                                    <button
                                        onClick={() => saveConfig(gw.id)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                    >
                                        <Save size={18} /> Guardar Configuración
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
