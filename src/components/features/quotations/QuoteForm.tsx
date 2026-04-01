'use client';

/**
 * Quote Form Component - Enhanced with Event Fields
 * Formulario de cotización con campos de evento
 * Permite cotizaciones anónimas con registro posterior
 */

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, User, Mail, Phone, FileText, Send, Loader2 } from 'lucide-react';
import { SmartDatePicker, SmartTimePicker } from '@/components/ui/smart-datetime-picker';

interface Category {
    id: string;
    name: string;
    icon?: string;
}

export default function QuoteForm() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        categoryId: '',
        brief: '',
        eventDate: '',
        eventTime: '', // Added Event Start Time
        eventLocation: '',
        setupTime: '',
        teardownTime: '',
        terms: false,
    });
    // ...
    // ...
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [quoteCode, setQuoteCode] = useState('');

    useEffect(() => {
        // Cargar categorías dinámicamente
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(() => {
                // Fallback a categorías estáticas
                setCategories([
                    { id: 'audio', name: 'Audio Profesional', icon: '🔊' },
                    { id: 'iluminacion', name: 'Iluminación', icon: '💡' },
                    { id: 'pantallas', name: 'Pantallas LED', icon: '📺' },
                    { id: 'escenarios', name: 'Escenarios & Truss', icon: '🎪' },
                    { id: 'produccion', name: 'Producción Completa', icon: '🎬' },
                ]);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validaciones
        if (!formData.clientEmail || !formData.brief || !formData.clientName) {
            setError('Por favor completa todos los campos requeridos');
            setLoading(false);
            return;
        }

        if (!formData.terms) {
            setError('Debes aceptar la política de privacidad');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    eventStartDate: formData.eventDate,
                    eventEndDate: formData.eventDate,
                    setupTime: formData.setupTime,
                    teardownTime: formData.teardownTime,
                    eventLocation: formData.eventLocation,
                    pendingAuth: true, // Flag for pending authentication
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setQuoteCode(data.code);
                // Guardar código en localStorage para vinculación posterior
                localStorage.setItem('pendingQuotation', JSON.stringify({
                    code: data.code,
                    email: formData.clientEmail,
                }));
                // Redirigir a página de éxito con parámetro de auth pendiente
                router.push(`/quotation/success?code=${data.code}&pendingAuth=true`);
            } else {
                setError(data.error || 'Error al enviar la cotización');
            }
        } catch (error) {
            logger.error('Error submitting quote form:', error);
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-card rounded-3xl p-8 md:p-12 shadow-2xl text-center border border-border">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">¡Solicitud Recibida!</h2>
                <p className="text-muted-foreground mb-4">
                    Tu cotización ha sido registrada con el código:
                </p>
                <p className="font-mono text-2xl font-bold text-primary mb-6">{quoteCode}</p>
                <p className="text-muted-foreground text-sm mb-8">
                    Te contactaremos en menos de 24 horas hábiles.
                    Revisa tu correo electrónico para más detalles.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
                >
                    Enviar Otra Cotización
                </button>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-border">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                    Solicita tu Cotización Gratis
                </h2>
                <p className="text-muted-foreground">
                    Cuéntanos sobre tu evento y te responderemos en menos de 24 horas.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground bg-background"
                            placeholder="Ej: Juan Pérez"
                            required
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Email *
                        </label>
                        <input
                            type="email"
                            name="clientEmail"
                            value={formData.clientEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground bg-background"
                            placeholder="Ej: juan@empresa.cl"
                            required
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            name="clientPhone"
                            value={formData.clientPhone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground bg-background"
                            placeholder="Ej: +56 9 1234 5678"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de Servicio *
                        </label>
                        <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-foreground"
                            required
                        >
                            <option value="">Selecciona una opción</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Event Details */}
                <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Detalles del Evento
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Fecha del Evento *
                            </label>
                            <SmartDatePicker
                                value={formData.eventDate}
                                onChange={(val) => setFormData(prev => ({ ...prev, eventDate: val }))}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Hora de Inicio *
                            </label>
                            <SmartTimePicker
                                value={formData.eventTime}
                                onChange={(val) => setFormData(prev => ({ ...prev, eventTime: val }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">¿A qué hora comienza el evento?</p>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Ubicación del Evento *
                        </label>
                        <input
                            type="text"
                            name="eventLocation"
                            value={formData.eventLocation}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground bg-background"
                            placeholder="Ej: Espacio Riesco, Santiago"
                            required
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Hora de Montaje
                            </label>
                            <SmartTimePicker
                                value={formData.setupTime}
                                onChange={(val) => setFormData(prev => ({ ...prev, setupTime: val }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">¿A qué hora debemos llegar?</p>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Hora de Desmontaje
                            </label>
                            <SmartTimePicker
                                value={formData.teardownTime}
                                onChange={(val) => setFormData(prev => ({ ...prev, teardownTime: val }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">¿A qué hora termina el evento?</p>
                        </div>
                    </div>
                </div>

                {/* Brief */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Cuéntanos sobre tu proyecto *
                    </label>
                    <textarea
                        name="brief"
                        value={formData.brief}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none text-foreground bg-background"
                        placeholder="Describe lo que necesitas: cantidad de personas, duración, referencias, etc."
                        required
                    />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                        Acepto que mis datos sean utilizados para contactarme respecto a esta cotización.
                        Ver <a href="/privacy" className="text-primary underline">Política de Privacidad</a>.
                    </label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="h-5 w-5" />
                            Enviar Solicitud de Cotización
                        </>
                    )}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                    🔒 Tu información está segura. No compartimos tus datos con terceros.
                </p>
            </form>
        </div>
    );
}
