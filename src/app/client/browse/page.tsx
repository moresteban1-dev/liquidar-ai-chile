'use client';

/**
 * Client Browse/Catalog Page - Refactored
 * Service catalog browsing for clients using LiquidCard and Dark Mode
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Unused formatCLP import removed
import { LiquidCard } from '@/components/ui/liquid-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Package,
    Image as ImageIcon,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import Image from 'next/image';

interface Service {
    id: string;
    name: string;
    description: string;
    priceFrom: number | null;
    imageUrl?: string;
    slug: string;
}



export default function BrowseServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch('/api/services');
                if (res.ok) {
                    const data = await res.json();
                    setServices(data);
                } else {
                    // Fallback mock data
                    setServices([
                        {
                            id: 'srv-1',
                            name: 'Diseño de Logo Profesional',
                            description: 'Identidad visual completa para tu marca. Incluye 3 propuestas y revisiones ilimitadas.',
                            priceFrom: 150000,
                            slug: 'logo-design',
                            imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799314346d?w=800&auto=format&fit=crop&q=60'
                        },
                        {
                            id: 'srv-2',
                            name: 'Desarrollo Web Corporativo',
                            description: 'Sitio web responsive, optimizado para SEO y autoadministrable.',
                            priceFrom: 450000,
                            slug: 'web-dev',
                            imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=60'
                        },
                        {
                            id: 'srv-3',
                            name: 'Gestión de Redes Sociales',
                            description: 'Plan mensual de contenidos, diseño gráfico y gestión de comunidad.',
                            priceFrom: 200000,
                            slug: 'social-media',
                            imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60'
                        },
                        {
                            id: 'srv-4',
                            name: 'Campaña Google Ads',
                            description: 'Configuración y optimización de campañas SEM para generar leads cualificados.',
                            priceFrom: 100000,
                            slug: 'google-ads',
                            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60'
                        }
                    ]);
                }
            } catch (err) {
                logger.error('Error fetching services:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 bg-muted" />
                    <Skeleton className="h-5 w-96 bg-muted" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-96 rounded-2xl bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Catálogo de Servicios</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Soluciones profesionales para impulsar tu negocio.
                    </p>
                </div>
                {/* Optional: Filter or Sort controls could go here */}
            </div>

            {/* Services Grid */}
            {services.length === 0 ? (
                <div className="text-center py-24 rounded-2xl border border-dashed border-border bg-muted/50">
                    <Package className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">No hay servicios disponibles</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Vuelve pronto, estamos preparando nuevos servicios para ti.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service) => (
                        <LiquidCard
                            key={service.id}
                            noPadding
                            className="h-full flex flex-col group hover:-translate-y-1 transition-transform duration-300"
                            gradient
                        >
                            {/* Image Header */}
                            <div className="h-56 relative overflow-hidden bg-muted">
                                {service.imageUrl ? (
                                    <Image
                                        src={service.imageUrl}
                                        alt={service.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-60" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="backdrop-blur-md bg-white/10 dark:bg-black/20 rounded-full px-3 py-1 w-fit border border-white/20">
                                        <span className="text-xs font-medium text-white flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            Servicio Premium
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {service.name}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                                    {service.description}
                                </p>

                                <div className="mt-auto pt-6 border-t border-border flex items-center justify-end">
                                    {/* Price hidden */}
                                    <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" asChild>
                                        <Link href={`/client/quotations/create?serviceId=${service.id}`}>
                                            Cotizar <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </LiquidCard>
                    ))}
                </div>
            )}
        </div>
    );
}
