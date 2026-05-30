'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, RefreshCw, Key, Settings, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface AIProvider {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    api_key: string;
    default_model: string;
    custom_config: any;
}

export function AIManagerPanel() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [testingSlug, setTestingSlug] = useState<string | null>(null);
    const [latencies, setLatencies] = useState<Record<string, number>>({});
    const [testErrors, setTestErrors] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);

    // Cargar proveedores al montar
    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-providers');
            const data = await res.json();
            if (data.providers) {
                setProviders(data.providers);
            } else {
                toast.error('Error al cargar proveedores de IA.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error de red al cargar proveedores de IA.');
        } finally {
            setLoading(false);
        }
    };

    // Actualizar campos locales en el formulario
    const handleFieldChange = (id: string, field: keyof AIProvider, value: any) => {
        setProviders(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Guardar cambios del proveedor
    const saveProvider = async (provider: AIProvider) => {
        setSavingId(provider.id);
        const toastId = toast.loading(`Guardando configuración de ${provider.name}...`);
        try {
            const res = await fetch('/api/admin/ai-providers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_id: provider.id,
                    is_active: provider.is_active,
                    default_model: provider.default_model,
                    api_key: provider.api_key
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Configuración guardada exitosamente.', { id: toastId });
                fetchProviders(); // Refrescar datos limpios de la BD
            } else {
                toast.error(data.error || 'Error al guardar configuración.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Error de red al guardar configuración.', { id: toastId });
        } finally {
            setSavingId(null);
        }
    };

    // Probar conexión y latencia en vivo
    const testConnection = async (provider: AIProvider) => {
        if (!provider.api_key) {
            toast.error('Introduce una API Key antes de probar la conexión.');
            return;
        }

        setTestingSlug(provider.slug);
        setTestErrors(prev => ({ ...prev, [provider.slug]: '' }));
        const toastId = toast.loading(`Probando latencia con ${provider.name}...`);

        try {
            const res = await fetch('/api/admin/ai-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: provider.slug,
                    api_key: provider.api_key,
                    default_model: provider.default_model
                })
            });
            const data = await res.json();

            if (data.success) {
                setLatencies(prev => ({ ...prev, [provider.slug]: data.latencyMs }));
                toast.success(`¡Conexión exitosa! Latencia: ${data.latencyMs}ms`, { id: toastId });
            } else {
                setTestErrors(prev => ({ ...prev, [provider.slug]: data.error || 'Fallo de autenticación o API.' }));
                toast.error(data.error || 'Fallo al conectar con el proveedor.', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error('Error de infraestructura al probar conexión.', { id: toastId });
        } finally {
            setTestingSlug(null);
        }
    };

    const getLatencyBadgeColor = (latency: number) => {
        if (latency < 400) return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
        if (latency < 1200) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
        return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando motores cognitivos de IA...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Enrutamiento Inteligente y Resiliente</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Activa los proveedores que desees ocupar en tu plataforma. Si un proveedor primario se cae o agota sus cuotas, el despachador inteligente de la plataforma redirigirá automáticamente las llamadas cognitivas (oráculos de precios, SEO, cotizaciones) a un proveedor activo secundario como fallback seguro.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {providers.map(provider => (
                    <Card key={provider.id} className="overflow-hidden border border-border/60 hover:shadow-md transition-all duration-300 bg-card/40 backdrop-blur-md">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <Cpu className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        {provider.name}
                                        {provider.is_active && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                Activo
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Slug identificador: <code className="text-indigo-400 font-mono text-[10px] bg-muted/60 px-1 py-0.5 rounded">{provider.slug}</code>
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className="text-xs text-muted-foreground font-medium">Estado del Proveedor</span>
                                <Switch
                                    checked={provider.is_active}
                                    onCheckedChange={(checked) => handleFieldChange(provider.id, 'is_active', checked)}
                                    disabled={savingId === provider.id}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Clave de API */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Key className="h-3.5 w-3.5 text-muted-foreground" /> API Key
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••••••••••••••"
                                        value={provider.api_key || ''}
                                        onChange={(e) => handleFieldChange(provider.id, 'api_key', e.target.value)}
                                        className="bg-muted/30 border-border/85"
                                    />
                                </div>

                                {/* Modelo por Defecto */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Modelo Recomendado / Por Defecto
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. gpt-4o-mini, gemini-1.5-pro"
                                        value={provider.default_model || ''}
                                        onChange={(e) => handleFieldChange(provider.id, 'default_model', e.target.value)}
                                        className="bg-muted/30 border-border/85 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {/* Mostrar errores del test */}
                            {testErrors[provider.slug] && (
                                <div className="bg-rose-500/5 border border-rose-500/10 text-rose-500 text-xs p-3 rounded-lg flex items-start gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{testErrors[provider.slug]}</span>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
                                <div className="flex items-center gap-2">
                                    {latencies[provider.slug] !== undefined && (
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${getLatencyBadgeColor(latencies[provider.slug]!)}`}>
                                            <Zap className="h-3 w-3" />
                                            Latencia: {latencies[provider.slug]}ms
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => testConnection(provider)}
                                        disabled={testingSlug === provider.slug || savingId === provider.id}
                                        className="h-9 px-4 text-xs font-semibold gap-1.5 border-border/80 hover:bg-muted/50 transition-colors"
                                    >
                                        <Zap className={`h-3.5 w-3.5 ${testingSlug === provider.slug ? 'animate-pulse text-indigo-400' : ''}`} />
                                        {testingSlug === provider.slug ? 'Probando...' : 'Probar Conexión'}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => saveProvider(provider)}
                                        disabled={savingId === provider.id || testingSlug === provider.slug}
                                        className="h-9 px-4 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
