"use client"

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, ChevronLeft, MapPin, Clock, Truck, User, Package } from 'lucide-react'
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
import { quoteSchema, QuoteFormValues } from '@/lib/validators/quote-schema'

const STEPS = [
    { id: 1, title: "¿Quién eres?", icon: User },
    { id: 2, title: "¿Qué necesitas?", icon: Package },
    { id: 3, title: "Logística Fina", icon: Truck },
]


interface QuoteWizardProps {
    initialItems?: { serviceId: string; quantity: number; name: string; priceEstimate?: number }[]
}

export function QuoteWizard({ initialItems }: QuoteWizardProps) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mode: Cart vs Single Service
    const isCartMode = initialItems && initialItems.length > 0;

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        mode: "onChange",
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

    const { trigger } = form

    // Navigation Logic
    const nextStep = async () => {
        let fieldsToValidate: (keyof QuoteFormValues)[] = []

        if (currentStep === 1) {
            fieldsToValidate = ["clientName", "clientRut", "clientEmail", "clientPhone"]
        } else if (currentStep === 2) {
            // Validate serviceId ONLY if not in cart mode, else validate items (which are implicit)
            fieldsToValidate = isCartMode ? ["comments", "items"] : ["serviceId", "eventDate", "comments"]
        }

        const isValid = await trigger(fieldsToValidate)
        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
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
                // Handle Category Slug vs UUID
                // If serviceId is not a UUID (e.g. 'audio'), send it as categoryId
                categoryId: (data.serviceId && !data.serviceId.includes('-')) ? data.serviceId : undefined,
                serviceId: (data.serviceId && data.serviceId.includes('-')) ? data.serviceId : undefined,

                // Map comments to brief (API expectation)
                brief: data.comments,

                // Ensure items are sent if in cart mode
                items: isCartMode ? initialItems?.map(i => ({ serviceId: i.serviceId, quantity: i.quantity })) : [],
            };

            const response = await fetch('/api/quotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

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
                logger.error("Submission Error:", result);
                toast.error("Error al enviar", {
                    description: result.error || "Hubo un problema al procesar tu solicitud."
                })
            }
        } catch (error) {
            toast.error("Error inesperado", {
                description: "Por favor intenta nuevamente más tarde."
            })
            logger.error(String(error))
        } finally {
            setIsSubmitting(false)
        }
    }

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                                            <Input placeholder="76.123.456-K" {...field} onChange={(e) => {
                                                                // Basic formatter could go here
                                                                field.onChange(e)
                                                            }} />
                                                        </FormControl>
                                                        <FormDescription>Formato con guión: 12345678-9</FormDescription>
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
                                                                <select
                                                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                    {...field}
                                                                >
                                                                    <option value="">Selecciona...</option>
                                                                    <option value="audio">Audio Profesional</option>
                                                                    <option value="iluminacion">Iluminación</option>
                                                                    <option value="pantallas">Pantallas LED</option>
                                                                    <option value="escenarios">Escenarios & Truss</option>
                                                                    <option value="produccion">Producción Completa</option>
                                                                </select>
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
                                                                onChange={(e) => field.onChange(new Date(e.target.value))}
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
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input className="pl-9" placeholder="Av. Costanera Sur 2710, Santiago" {...field} />
                                                        </div>
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
