"use client";

import { motion } from 'framer-motion';

export default function ProcessSteps() {
    return (
        <section className="py-20 bg-muted/30">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Proceso de Arriendo
                    </h2>
                    <p className="text-muted-foreground">
                        Simple, rápido y confiable.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ staggerChildren: 0.15 }}
                    className="grid md:grid-cols-4 gap-8"
                >
                    {[
                        { num: '1', titulo: 'Selecciona', desc: 'Elige los equipos o servicios que necesitas en nuestro catálogo.' },
                        { num: '2', titulo: 'Cotiza', desc: 'Te enviamos disponibilidad y precios finales en minutos.' },
                        { num: '3', titulo: 'Reserva', desc: 'Confirma tu reserva con un abono seguro vía Webpay.' },
                        { num: '4', titulo: 'Evento Exitoso', desc: 'Coordinamos el montaje o retiro de equipos puntualmente.' },
                    ].map((paso, idx) => (
                        <motion.div
                            key={paso.num}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            className="text-center"
                        >
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                                <span className="-rotate-3">{paso.num}</span>
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">{paso.titulo}</h3>
                            <p className="text-sm text-muted-foreground">{paso.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
