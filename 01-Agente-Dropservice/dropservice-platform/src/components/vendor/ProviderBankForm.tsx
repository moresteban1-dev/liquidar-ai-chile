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
import { updateProviderBankDetails } from '@/actions/users';
import { Loader2, Save } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'


const bankSchema = z.object({
    rut: z.string().min(8, 'RUT inválido'),
    bank_name: z.string().min(2, 'Nombre del banco requerido'),
    bank_account_type: z.string().min(2, 'Tipo de cuenta requerido'),
    bank_account_number: z.string().min(4, 'Número de cuenta requerido'),
});

type BankFormValues = z.infer<typeof bankSchema>;

interface ProviderBankFormProps {
    profile: UserProfile;
}

export function ProviderBankForm({ profile }: ProviderBankFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const providerData = Array.isArray(profile.providerProfiles)
        ? profile.providerProfiles[0]
        : profile.providerProfiles;

    const form = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: {
            rut: providerData?.rut || '',
            bank_name: providerData?.bank_name || '',
            bank_account_type: providerData?.bank_account_type || '',
            bank_account_number: providerData?.bank_account_number || '',
        },
    });

    const onSubmit = async (data: BankFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await updateProviderBankDetails(data);
            if (result && result.success) {
                toast.success('Datos bancarios actualizados');
            } else {
                toast.error(result?.error || 'Error al actualizar datos');
            }
        } catch (error) {
            logger.error(error);
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Mis Datos Bancarios</CardTitle>
                <CardDescription>
                    Ingresa los datos de la cuenta donde recibirás los pagos por tus servicios.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                        <FormField
                            control={form.control}
                            name="rut"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>RUT Titular</FormLabel>
                                    <FormControl>
                                        <Input placeholder="12.345.678-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bank_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Banco</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Banco de Chile">Banco de Chile</SelectItem>
                                                <SelectItem value="BancoEstado">BancoEstado</SelectItem>
                                                <SelectItem value="Santander">Santander</SelectItem>
                                                <SelectItem value="BCI">BCI</SelectItem>
                                                <SelectItem value="Itaú">Itaú</SelectItem>
                                                <SelectItem value="Scotiabank">Scotiabank</SelectItem>
                                                <SelectItem value="Falabella">Falabella</SelectItem>
                                                <SelectItem value="Ripley">Ripley</SelectItem>
                                                <SelectItem value="Consorcio">Consorcio</SelectItem>
                                                <SelectItem value="Security">Security</SelectItem>
                                                <SelectItem value="BICE">BICE</SelectItem>
                                                <SelectItem value="Internacional">Internacional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bank_account_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Cuenta</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Cuenta Corriente">Cuenta Corriente</SelectItem>
                                                <SelectItem value="Cuenta Vista / RUT">Cuenta Vista / RUT</SelectItem>
                                                <SelectItem value="Cuenta de Ahorro">Cuenta de Ahorro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="bank_account_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Cuenta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: 123456789" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="pt-4 border-t mt-6">
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Guardar Datos Bancarios
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
