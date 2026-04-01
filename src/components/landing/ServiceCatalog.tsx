"use client";

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { motion } from 'framer-motion';

// function formatCLP removed

interface Service {
    id: string;
    name: string;
    description: string;
    price_from: number;
    image_url: string | null;
    category_id: string;
    category: {
        id: string;
        name: string;
        slug: string;
        icon: string;
    };
}

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    services?: string[]; // constructed for UI
}

export default function ServiceCatalog() {
    const { addItem } = useCart();
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Services
                const resServices = await fetch('/api/services');
                const dataServices = await resServices.json();

                // Fetch Categories
                const resCategories = await fetch('/api/categories');
                const dataCategories = await resCategories.json();

                if (Array.isArray(dataServices)) {
                    setServices(dataServices);
                }
                if (Array.isArray(dataCategories)) {
                    // Populate services list for display in category card if needed, 
                    // or just use raw categories
                    const catsWithServices = dataCategories.map((cat: Category) => ({
                        ...cat,
                        // Find top 4 services for this category to display as bullet points
                        services: dataServices
                            .filter((s: Service) => s.category?.id === cat.id)
                            .slice(0, 4)
                            .map((s: Service) => s.name)
                    }));
                    setCategories(catsWithServices);
                }
            } catch (error) {
                logger.error("Failed to fetch catalog data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return <div className="py-20 text-center">Cargando catálogo...</div>;
    }

    return (
        <section id="servicios" className="py-24 bg-background relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                        Catálogo de Equipamiento
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Encuentra el equipo perfecto para tu concierto, conferencia o fiesta.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, staggerChildren: 0.1 }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
                >
                    {categories.map((cat, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            key={cat.id}
                            className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-card border border-border/50 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-indigo-500/10"
                        >
                            <div className="text-5xl mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300 transform-gpu">{cat.icon || '📦'}</div>
                            <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-indigo-400 transition-colors">
                                {cat.name}
                            </h3>
                            <ul className="space-y-2">
                                {cat.services?.map((s) => (
                                    <li key={s} className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-indigo-500/50"></span>
                                        {s}
                                    </li>
                                ))}
                                {(!cat.services || cat.services.length === 0) && (
                                    <li className="text-sm text-muted-foreground/60 italic">Sin servicios aún</li>
                                )}
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Servicios Destacados */}
                <h3 className="text-3xl font-bold text-foreground mb-8 text-center tracking-tight">
                    Todos los Servicios
                </h3>
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {services.map((servicio, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            key={servicio.id}
                            className="bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all duration-300 group flex flex-col h-full"
                        >
                            {/* Optimización de Imagen */}
                            {servicio.image_url ? (
                                <div className="w-full h-48 relative overflow-hidden bg-muted">
                                    <Image
                                        src={servicio.image_url}
                                        alt={servicio.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-48 bg-muted/50 flex flex-col items-center justify-center border-b border-border/50">
                                    <div className="text-4xl opacity-50 mb-2">{servicio.category?.icon || '📦'}</div>
                                </div>
                            )}

                            <div className="p-6 flex flex-col flex-1">
                                <h4 className="font-semibold text-lg text-foreground mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1" title={servicio.name}>{servicio.name}</h4>
                                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">{servicio.description}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 hover:border-indigo-500/40 transition-all font-medium"
                                    onClick={() => addItem({
                                        serviceId: servicio.id,
                                        name: servicio.name,
                                        priceEstimate: servicio.price_from,
                                        quantity: 1
                                    })}
                                >
                                    Cotizar
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
