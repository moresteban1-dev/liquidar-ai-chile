'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateUserProfile } from '@/actions/users';
import { Loader2, Save } from 'lucide-react';

// Schema
const profileSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    billing_rut: z.string().optional(),
    billing_company_name: z.string().optional(),
    billing_address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

import { UserProfile } from '@/lib/types';

interface ProfileFormProps {
    initialData: UserProfile;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialData.name || '',
            phone: initialData.phone || '',
            billing_rut: initialData.billing_rut || '',
            billing_company_name: initialData.billing_company_name || '',
            billing_address: initialData.billing_address || '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await updateUserProfile(data);
            if (result && result.success) {
                toast.success('Perfil actualizado correctamente');
            } else {
                toast.error('Error al actualizar perfil');
            }
        } catch (error) {
            logger.error('Error updating profile', { error: String(error) });
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tu Perfil</CardTitle>
                <CardDescription>Administra tu información personal y de contacto.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tu Nombre" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input value={initialData.email} disabled className="bg-muted" />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
                        </FormItem>

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teléfono</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+56 9 1234 5678" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="border-t pt-4 mt-6">
                            <h3 className="font-semibold text-lg mb-4">Datos de Facturación (Opcional)</h3>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="billing_rut"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RUT Empresa / Personal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="76.123.456-K" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="billing_company_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Razón Social / Nombre</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nombre de la empresa" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="billing_address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección de Facturación</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Av. Providencia 1234, Of 501" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
