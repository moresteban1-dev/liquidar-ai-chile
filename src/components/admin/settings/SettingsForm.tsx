'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { OrganizationSettings } from '@/lib/types/settings';
import { updateOrganizationSettings } from '@/actions/settings'; // You'll need to create this action

const formSchema = z.object({
    company_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    contact_email: z.string().email('Email inválido'),
    whatsapp_number: z.string().min(8, 'Número inválido'),
    legal_name: z.string().optional(),
    legal_rut: z.string().optional(),
    bank_name: z.string().optional(),
    account_type: z.string().optional(),
    account_number: z.string().optional(),
});

interface SettingsFormProps {
    initialData: OrganizationSettings | null;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company_name: initialData?.company_name || '',
            contact_email: initialData?.contact_email || '',
            whatsapp_number: initialData?.whatsapp_number || '',
            legal_name: initialData?.legal_name || '',
            legal_rut: initialData?.legal_rut || '',
            bank_name: initialData?.bank_name || '',
            account_type: initialData?.account_type || '',
            account_number: initialData?.account_number || '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            await updateOrganizationSettings(values);
            toast.success('Configuración actualizada correctamente');
        } catch (error: unknown) {
            logger.error(error instanceof Error ? error.message : String(error));
            toast.error('Error al actualizar la configuración');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                        <CardDescription>Datos básicos de la empresa visibles en el sitio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="company_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de Fantasía</FormLabel>
                                        <FormControl>
                                            <Input placeholder="EventHub" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contact_email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email de Contacto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="contacto@empresa.cl" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="whatsapp_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp (Internacional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+569..." {...field} />
                                        </FormControl>
                                        <FormDescription>Formato: +569XXXXXXXX</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Información Legal</CardTitle>
                        <CardDescription>Datos para facturación y footer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="legal_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razón Social</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Empresa SpA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="legal_rut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>RUT</FormLabel>
                                        <FormControl>
                                            <Input placeholder="77.777.777-7" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Datos Bancarios</CardTitle>
                        <CardDescription>Información para transferencias de clientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="bank_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Banco</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Banco de Chile" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="account_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Cuenta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Cta Corriente" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="account_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Cuenta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="00-000-00000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
    );
}
