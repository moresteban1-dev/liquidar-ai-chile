'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CatalogCategory, CatalogStatus as _CatalogStatus } from '@core/domain/catalog/CatalogTypes';
import { Loader2, Save } from 'lucide-react';

export const CatalogCategoryFormSchema = z.object({
    id: z.string().optional(),
    parentId: z.string().nullish(),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    code: z.string().min(2, 'El código es obligatorio'),
    slug: z.string().min(3, 'El slug es obligatorio'),
    level: z.number().min(1).max(3),
    itemType: z.string(),
    status: z.string(),
});

export type CatalogCategoryFormData = z.infer<typeof CatalogCategoryFormSchema>;

interface CatalogCategoryFormProps {
    initialData?: CatalogCategory | null;
    categories: CatalogCategory[];
    onSubmit: (data: CatalogCategoryFormData) => Promise<void>;
    isLoading?: boolean;
}

export function CatalogCategoryForm({ initialData, categories, onSubmit, isLoading }: CatalogCategoryFormProps) {
    const form = useForm<CatalogCategoryFormData>({
        resolver: zodResolver(CatalogCategoryFormSchema),
        defaultValues: initialData ? {
            id: initialData.id,
            parentId: initialData.parentId,
            name: initialData.name,
            code: initialData.code,
            slug: initialData.slug,
            level: Number(initialData.level),
            itemType: initialData.itemType,
            status: initialData.status,
        } : {
            name: '',
            code: '',
            slug: '',
            level: 1,
            itemType: 'SERVICE',
            status: 'ACTIVE',
            parentId: null,
        },
    });

    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setValue('name', name);
        if (!initialData?.id) {
            const slug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            form.setValue('slug', slug);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Categoría</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Pintura y Acabados" {...field} onChange={onNameChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                    <Input placeholder="PIN-00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug (URL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="pintura-acabados" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nivel Hierárquico</FormLabel>
                                <Select 
                                    onValueChange={(v) => field.onChange(parseInt(v))} 
                                    value={(field.value ?? 1).toString()}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona nivel" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">Nivel 1 (Principal)</SelectItem>
                                        <SelectItem value="2">Nivel 2 (Sub-Categoría)</SelectItem>
                                        <SelectItem value="3">Nivel 3 (Detalle)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría Padre</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Ninguna" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="">Ninguna (Raíz)</SelectItem>
                                        {categories
                                            .filter(c => c.id !== initialData?.id && c.level < 3)
                                            .map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="itemType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Ítems base</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SERVICE">Servicios</SelectItem>
                                        <SelectItem value="EQUIPMENT">Equipos</SelectItem>
                                        <SelectItem value="MIXED">Mixto</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                         control={form.control}
                         name="status"
                         render={({ field }) => (
                             <FormItem>
                                 <FormLabel>Estado</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                     <FormControl>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Estado" />
                                         </SelectTrigger>
                                     </FormControl>
                                     <SelectContent>
                                         <SelectItem value="ACTIVE">Activo</SelectItem>
                                         <SelectItem value="DRAFT">Borrador</SelectItem>
                                         <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                     </SelectContent>
                                 </Select>
                             </FormItem>
                         )}
                     />
                </div>

                <div className="flex justify-end pt-6">
                    <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-10 h-12 shadow-lg">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {initialData?.id ? 'Actualizar Categoría' : 'Crear Categoría'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
