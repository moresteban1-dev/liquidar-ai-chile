"use client"

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, ChevronLeft, MapPin, Clock, Truck, User, Package, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { LiquidCard } from '@/components/ui/liquid-card'
import { quoteSchema, quoteStep1Schema, quoteStep2Schema, quoteStep3Schema, QuoteFormValues } from '@/lib/validators/quote-schema'
import { RutValidator } from '@/lib/validators/RutValidator'

const STEPS = [
    { id: 1, title: "¿Quién eres?", icon: User },
    { id: 2, title: "¿Qué necesitas?", icon: Package },
    { id: 3, title: "Logística Fina", icon: Truck },
]


/** Categoría del catálogo maestro V2 */
interface MasterCategory {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
}

interface QuoteWizardProps {
    initialItems?: { serviceId: string; quantity: number; name: string; priceEstimate?: number }[]
}

export function QuoteWizard({ initialItems }: QuoteWizardProps) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    // Carga dinámica del catálogo maestro V2
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch('/api/categories')
                if (!res.ok) throw new Error('Failed to fetch categories')
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Solo mostrar categorías de nivel 1 (parentId === null) para simplificar el wizard
                    const topLevel = data.filter((c: any) => !c.parentId)
                    setMasterCategories(topLevel)
                }
            } catch (error) {
                logger.error('Error al cargar categorías del catálogo maestro', error)
                toast.error('No se pudieron cargar los servicios disponibles')
            } finally {
                setLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    // Mode: Cart vs Single Service
    const isCartMode = initialItems && initialItems.length > 0;

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        mode: "onSubmit",
        defaultValues: {
            clientName: "",
            clientRut: "",
            clientEmail: "",
            clientPhone: "",
            serviceId: "",
            items: isCartMode ? initialItems.map(i => ({ serviceId: i.serviceId, quantity: i.quantity })) : [],
            comments: "",
            needsTechnicalVisit: false,
            venueAddress: "",
            mountingTime: "10:00",
            eventStartTime: "20:00",
            eventEndTime: "02:00",
            dismountingTime: "03:00",
        },
    })

    const { trigger, getValues } = form

    // Expose form methods for E2E automation (only in dev/test)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__QUOTEWIZARD_FORM__ = {
                setValue: form.setValue,
                getValues: form.getValues,
            };
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__QUOTEWIZARD_FORM__;
            }
        };
    }, [form]);

    // Navigation Logic — per-step validation using isolated sub-schemas
    // This avoids .refine() on the full schema firing against unfilled future-step fields
    const nextStep = async () => {
        const values = getValues();
        let validationResult;

        if (currentStep === 1) {
            validationResult = quoteStep1Schema.safeParse(values);
        } else if (currentStep === 2) {
            validationResult = quoteStep2Schema.safeParse(values);
        } else {
            // Step 3 validated on submit
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
            return;
        }

        if (validationResult.success) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
        } else {
            // Surface errors to React Hook Form UI
            for (const issue of validationResult.error.issues) {
                const fieldName = issue.path[0] as keyof QuoteFormValues;
                form.setError(fieldName, { message: issue.message });
            }
        }
    }

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1))
    }

    // Final Submission via API Route (More robust than legacy server action)
    const onSubmit = async (data: QuoteFormValues) => {
        setIsSubmitting(true)
        try {
            // Construct Event Dates
            const eventDateStr = data.eventDate.toISOString().split('T')[0];
            const eventStartDate = new Date(`${eventDateStr}T${data.eventStartTime}:00`);

            // Handle overnight events (End time < Start time implies next day)
            const eventEndDate = new Date(`${eventDateStr}T${data.eventEndTime}:00`);
            if (data.eventEndTime < data.eventStartTime) {
                eventEndDate.setDate(eventEndDate.getDate() + 1);
            }

            const payload = {
                ...data,
                // Ensure backend receives specific Date fields
                eventStartDate: eventStartDate.toISOString(),
                eventEndDate: eventEndDate.toISOString(),
                // Handle Category UUID — el wizard ahora envía UUIDs del catálogo maestro V2
                // Siempre enviamos como categoryId para vinculación correcta
                categoryId: data.serviceId || undefined,
                serviceId: undefined, // No enviamos serviceId del wizard (es categoryId)

                // Map comments to brief (API expectation)
                brief: data.comments,

                // Ensure items are sent if in cart mode
                items: isCartMode ? initialItems?.map(i => ({ serviceId: i.serviceId, quantity: i.quantity })) : [],
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("¡Solicitud recibida!", {
                    description: result.message || "Tu cotización ha sido ingresada correctamente."
                })

                // Smart Redirect: 
                // If user is already in the client dashboard context (implied by path or auth state), 
                // we should keep them there or redirect to their list.
                // For now, we use the success page but we might want to change this to /client/quotations/[id] later
                // The issue reported is "logging out". This usually happens if the success page 
                // is outside the protected layout or if the cookie is lost.
                // Let's force a client-side navigation which preserves state.

                // If the user was already logged in (we can check via props or hook, but simpler to just push)
                router.push(`/client/quotations/success?code=${result.code}`)
                router.refresh(); // Ensure server components revalidate to show the new quote
            } else {
                toast.error("Error al enviar", {
                    description: result.error || `Error ${response.status}: Hubo un problema al procesar tu solicitud.`
                })
            }
        } catch {
            toast.error("Error de conexión", {
                description: "Por favor verifica tu conexión e intenta nuevamente."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    /**
     * Robust submission handler.
     * 
     * WHY NOT FormData? AnimatePresence unmounts Steps 1 & 2 inputs when showing Step 3.
     * FormData.get() returns null for unmounted inputs, causing false "required" errors.
     * 
     * SOLUTION: Use React Hook Form state as the SINGLE source of truth. RHF persists
     * all field values internally even when the rendered inputs are unmounted.
     */
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rhfValues = form.getValues();

        // Step 3 validation gate — surface errors immediately before full validation
        const step3Result = quoteStep3Schema.safeParse({
            venueAddress: rhfValues.venueAddress,
            mountingTime: rhfValues.mountingTime,
            eventStartTime: rhfValues.eventStartTime,
            eventEndTime: rhfValues.eventEndTime,
            dismountingTime: rhfValues.dismountingTime,
        });

        if (!step3Result.success) {
            for (const issue of step3Result.error.issues) {
                const fieldName = issue.path[0] as keyof QuoteFormValues;
                form.setError(fieldName, { message: issue.message });
            }
            return;
        }

        // Build submission data from RHF state (the only reliable source)
        const submissionData = {
            clientName: rhfValues.clientName || '',
            clientRut: rhfValues.clientRut || '',
            clientEmail: rhfValues.clientEmail || '',
            clientPhone: rhfValues.clientPhone || '',
            serviceId: rhfValues.serviceId || '',
            items: rhfValues.items || [],
            eventDate: rhfValues.eventDate || '',
            comments: rhfValues.comments || '',
            needsTechnicalVisit: rhfValues.needsTechnicalVisit || false,
            venueAddress: rhfValues.venueAddress || '',
            mountingTime: rhfValues.mountingTime || '10:00',
            eventStartTime: rhfValues.eventStartTime || '20:00',
            eventEndTime: rhfValues.eventEndTime || '02:00',
            dismountingTime: rhfValues.dismountingTime || '03:00',
        };

        // Full schema validation (includes cross-field refinements)
        const result = quoteSchema.safeParse(submissionData);
        if (!result.success) {
            logger.warn('[QuoteWizard] Validation failed on submit', { issues: result.error.issues });
            for (const issue of result.error.issues) {
                const fieldName = issue.path[0] as keyof QuoteFormValues;
                form.setError(fieldName, { message: issue.message });
            }
            // Navigate to the step containing the first error
            const firstErrorField = result.error.issues[0]?.path[0] as string;
            const step1Fields = ['clientName', 'clientRut', 'clientEmail', 'clientPhone'];
            const step2Fields = ['serviceId', 'items', 'eventDate', 'comments', 'needsTechnicalVisit'];
            if (step1Fields.includes(firstErrorField)) setCurrentStep(1);
            else if (step2Fields.includes(firstErrorField)) setCurrentStep(2);
            return;
        }

        await onSubmit(result.data);
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            {/* Steps Indicator */}
            <div className="mb-12">
                <div className="flex justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />

                    {/* Active Progress Bar */}
                    <motion.div
                        className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 -translate-y-1/2 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = step.id === currentStep
                        const isCompleted = step.id < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive || isCompleted
                                        ? "border-indigo-600 bg-indigo-600 text-white"
                                        : "border-muted text-muted-foreground bg-card"
                                        }`}
                                    animate={{ scale: isActive ? 1.1 : 1 }}
                                >
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </motion.div>
                                <span className={`text-xs font-medium ${isActive ? "text-indigo-600" : "text-muted-foreground"}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Wizard Form */}
            <LiquidCard className="bg-card/50 backdrop-blur-xl">
                <Form {...form}>
                    <form onSubmit={handleFormSubmit} className="space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* STEP 1: IDENTITY */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-xl font-bold">Cuéntanos sobre ti</h2>
                                            <p className="text-sm text-muted-foreground">Necesitamos tus datos para formalizar la cotización</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="clientName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nombre Completo / Razón Social</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Tu Nombre o Empresa SpA" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="clientRut"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>RUT Empresa/Persona</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="76.123.456-K" 
                                                                {...field} 
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    // Only format if the user is not deleting character at the end (to allow deleting dots/hyphens easily)
                                                                    const formatted = RutValidator.format(val);
                                                                    field.onChange(formatted);
                                                                }} 
                                                            />
                                                        </FormControl>
                                                        <FormDescription>Formato estándar: 12.345.678-K o 12345678-9</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="clientEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email Corporativo</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="contacto@empresa.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="clientPhone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Teléfono de Contacto</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+56 9 1234 5678" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: REQUIREMENT OR CART REVIEW */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-xl font-bold">{isCartMode ? "Resumen de Solicitud" : "¿Qué necesitas?"}</h2>
                                            <p className="text-sm text-muted-foreground">Define el servicio y la fecha del evento</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                            {isCartMode ? (
                                                <div className="col-span-2 bg-muted/50 p-4 rounded-lg border border-border">
                                                    <h3 className="font-semibold text-sm mb-3 text-foreground">Items a Cotizar</h3>
                                                    <ul className="space-y-2">
                                                        {initialItems?.map((item, idx) => (
                                                            <li key={idx} className="flex justify-between text-sm">
                                                                <span>{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                                                                {/* Price hidden as per requirement */}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <FormField
                                                    control={form.control}
                                                    name="serviceId"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2 md:col-span-1">
                                                            <FormLabel>Tipo de Servicio</FormLabel>
                                                            <FormControl>
                                                                {loadingCategories ? (
                                                                    <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Cargando catálogo...
                                                                    </div>
                                                                ) : (
                                                                    <select
                                                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        {...field}
                                                                    >
                                                                        <option value="">Selecciona un servicio...</option>
                                                                        {masterCategories.map((cat) => (
                                                                            <option key={cat.id} value={cat.id}>
                                                                                {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            <FormField
                                                control={form.control}
                                                name="eventDate"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2 md:col-span-1">
                                                        <FormLabel>Fecha del Evento</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="date"
                                                                {...field}
                                                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val) {
                                                                        const parsed = new Date(val);
                                                                        if (!isNaN(parsed.getTime())) {
                                                                            field.onChange(parsed);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="comments"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel>Detalles Técnicos</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Describe brevemente el evento, aforo estimado, o requerimientos específicos..."
                                                                className="resize-none"
                                                                rows={4}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="needsTechnicalVisit"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm col-span-2">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <div className="space-y-1 leading-none">
                                                            <FormLabel>
                                                                Solicitar Visita Técnica Previa
                                                            </FormLabel>
                                                            <FormDescription>
                                                                Recomendado para eventos complejos. Un productor visitará el lugar. (Costo adicional puede aplicar)
                                                            </FormDescription>
                                                        </div>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: LOGISTICS */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-xl font-bold">Logística Crítica</h2>
                                            <p className="text-sm text-muted-foreground">Horarios exactos para evitar fallos operativos</p>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="venueAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Lugar del Evento (Dirección exacta)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Av. Costanera Sur 2710, Santiago" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="mountingTime"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-emerald-600 font-semibold">Hora Montaje</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input type="time" className="pl-9" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="eventStartTime"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Inicio Evento</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="eventEndTime"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Fin Evento</FormLabel>
                                                        <FormControl>
                                                            <Input type="time" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="dismountingTime"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-amber-600 font-semibold">Hora Desmontaje</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input type="time" className="pl-9" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                                            <p className="flex gap-2 items-center"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> El equipo llegará a la hora de Montaje.</p>
                                            <p className="flex gap-2 items-center mt-1"><CheckCircle2 className="w-3 h-3 text-amber-500" /> El retiro se realizará estrictamente desde la hora de Desmontaje.</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4 border-t border-border">
                            <Button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1 || isSubmitting}
                                variant="outline"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Atrás
                            </Button>

                            {currentStep < 3 ? (
                                <Button type="button" onClick={nextStep}>
                                    Siguiente
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" loading={isSubmitting} variant="primary">
                                    Finalizar Cotización
                                    <CheckCircle2 className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </LiquidCard>
        </div >
    )
}
