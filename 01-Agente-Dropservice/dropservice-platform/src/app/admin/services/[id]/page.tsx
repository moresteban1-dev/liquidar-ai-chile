'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, use, useEffect, useCallback } from 'react';
import { DashboardLayout, Sidebar, NavItem, PageHeader } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Category {
    id: string;
    name: string;
}

const MOCK_CATEGORIES: Category[] = [
    { id: 'cat-marketing', name: 'Marketing Digital' },
    { id: 'cat-design', name: 'Diseño Gráfico' },
    { id: 'cat-dev', name: 'Desarrollo Web' },
    { id: 'cat-events', name: 'Eventos' }
];

export default function ServiceEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const isNew = id === 'new';
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        priceFrom: '',
        imageUrl: '',
        categoryId: '',
        isActive: true
    });
    const [categories] = useState<Category[]>(MOCK_CATEGORIES);

    useEffect(() => {
        if (!isNew) {
            // Fetch Service Details placeholder
        }
    }, [isNew, id]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isNew ? '/api/services' : `/api/services/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const payload = {
                ...formData,
                categoryId: formData.categoryId || 'cat-design'
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/admin/services');
                router.refresh();
            } else {
                alert('Error al guardar servicio');
            }
        } catch (error) {
            logger.error('Error saving service', error as Error);
            alert('Error de conexión');
        }
    }, [isNew, id, formData, router]);

    return (
        <DashboardLayout
            sidebar={
                <Sidebar
                    logo={<div className="font-bold text-xl">AdminPanel</div>}
                    navigation={
                        <div className="space-y-1">
                            <NavItem href="/admin" icon={<span>📊</span>} label="Dashboard" />
                            <NavItem href="/admin/quotations" icon={<span>📋</span>} label="Cotizaciones" />
                            <NavItem href="/admin/orders" icon={<span>📦</span>} label="Órdenes" />
                            <NavItem href="/admin/services" icon={<span>🏷️</span>} label="Catálogo" active />
                            <NavItem href="/admin/settings" icon={<span>⚙️</span>} label="Configuración" />
                        </div>
                    }
                />
            }
            header={
                <PageHeader
                    title={isNew ? 'Nuevo Servicio' : 'Editar Servicio'}
                    description="Información básica del servicio"
                />
            }
        >
            <div className="max-w-2xl mx-auto">
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Diseño de Logo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Selecciona una categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-yellow-600 mt-1">
                                Nota: Si la categoría no existe en base de datos, fallará al guardar. Asegúrate de tener categorías creadas o usa un seed de datos.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Corta</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={3}
                                className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe qué incluye el servicio..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Referencial (CLP)</label>
                                <input
                                    name="priceFrom"
                                    type="number"
                                    value={formData.priceFrom}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                />
                                <p className="text-xs text-slate-400 mt-1">Solo visible internamente</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL Imagen</label>
                                <input
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Link href="/admin/services">
                                <Button variant="ghost" type="button">Cancelar</Button>
                            </Link>
                            <Button variant="primary" type="submit">
                                {isNew ? 'Crear Servicio' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    );
}
