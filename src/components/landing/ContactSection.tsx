"use client";

import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';


import { siteConfig } from '@/config/site';

export default function ContactSection() {
    const { company } = siteConfig;

    return (
        <>
            <section id="contacto" className="py-24 bg-background relative border-t border-border/40">
                <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Bodega y Oficina</h3>
                            <p className="text-muted-foreground text-sm">Santiago, Región Metropolitana</p>
                        </div>
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">Contacto Comercial</h3>
                            <p className="text-muted-foreground text-sm">{company.email}</p>
                        </div>
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <Phone className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">WhatsApp</h3>
                            <p className="text-muted-foreground text-sm">{company.whatsapp}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="bg-black/40 backdrop-blur-xl py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img
                                    src="/logo-liquidar.png"
                                    alt="Liquidar.cl"
                                    className="h-10 w-auto object-contain bg-white/90 p-1.5 rounded-lg"
                                />
                            </div>
                            <p className="text-slate-400 text-sm">
                                Plataforma B2B de subastas de liquidación de stock paletizado e individual de grandes retailers en Chile.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Equipos</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="#" className="text-slate-400 hover:text-white">Escenarios</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Iluminación</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Audio Pro</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Pantallas LED</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Empresa</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="#" className="text-slate-400 hover:text-white">Quiénes Somos</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Proyectos</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Blog</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Trabaja con Nosotros</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Ayuda</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="#" className="text-slate-400 hover:text-white">Preguntas Frecuentes</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Términos y Condiciones</Link></li>
                                <li><Link href="#" className="text-slate-400 hover:text-white">Zonas de Despacho</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-600 text-sm">
                            © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-600 text-xs">Pago seguro con Webpay</span>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
