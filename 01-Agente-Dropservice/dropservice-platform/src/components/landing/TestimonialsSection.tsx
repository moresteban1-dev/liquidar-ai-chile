"use client";

// Testimonios de clientes
const testimonios = [
    {
        nombre: 'Carlos Ruiz',
        cargo: 'Productor General, Festivales Chile',
        texto: 'El equipo de iluminación llegó a la hora y todo funcionó perfecto. Muy recomendados para eventos grandes.',
        avatar: 'CR',
    },
    {
        nombre: 'Ana María Weiss',
        cargo: 'Wedding Planner',
        texto: 'Mis novios quedaron felices con la pista LED. El montaje fue super rápido y limpio.',
        avatar: 'AM',
    },
    {
        nombre: 'Felipe Soto',
        cargo: 'Gerente Marketing, Corp Group',
        texto: 'Arrendamos pantallas para nuestra convención anual y la calidad de imagen fue excelente.',
        avatar: 'FS',
    },
];

export default function TestimonialsSection() {
    return (
        <section className="py-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Clientes Felices
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonios.map((t, idx) => (
                        <div key={idx} className="bg-card border border-border shadow-sm rounded-2xl p-6">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-muted-foreground mb-4 italic">&quot;{t.texto}&quot;</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-primary font-bold text-sm">{t.avatar}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{t.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{t.cargo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
