'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { MediaUploader } from './MediaUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  createCatalogItemAction, 
  updateCatalogItemAction, 
  generateMarketingAction,
  createCategoryAction 
} from '@/actions/catalog';
import { MediaAsset, CatalogItem, CatalogCategory } from '@core/domain/catalog/CatalogTypes';
import { Loader2, Wand2, DollarSign, FileText, TrendingUp, Plus } from 'lucide-react';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useToast } from '@/hooks/use-toast';
import { CatalogCategoryForm, CatalogCategoryFormData } from './CatalogCategoryForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

const MediaAssetSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'video', 'document']),
  altText: z.string().optional(),
  caption: z.string().optional(),
  order: z.number().default(0),
});

const CatalogItemFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  type: z.enum(['service', 'product', 'equipment']),
  categoryId: z.string().uuid('Seleccione una categoría válida'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').optional().or(z.literal('')),
  priceSuggested: z.union([z.coerce.number().min(0, 'El precio debe ser positivo o cero'), z.literal(''), z.null()]).optional(),
  priceReferenceMin: z.union([z.coerce.number().min(0, 'El precio debe ser positivo o cero'), z.literal(''), z.null()]).optional(),
  priceReferenceMax: z.union([z.coerce.number().min(0, 'El precio debe ser positivo o cero'), z.literal(''), z.null()]).optional(),
  defaultMarginPercent: z.union([z.coerce.number().min(0).max(100), z.literal(''), z.null()]).optional(),
  images: z.array(MediaAssetSchema).min(1, 'Debe subir al menos una imagen'),
  videos: z.array(MediaAssetSchema).default([]),
  documents: z.array(MediaAssetSchema).default([]),
  technicalSpecs: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  priceType: z.enum(['FIJO', 'COTIZABLE', 'DESDE']).default('FIJO'),
});

type CatalogItemFormData = z.infer<typeof CatalogItemFormSchema>;

interface CatalogItemFormProps {
  item?: CatalogItem;
  categories: CatalogCategory[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CatalogItemForm({ item, categories, onSuccess, onCancel }: CatalogItemFormProps) {
  const { toast } = useToast();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [localCategories, setLocalCategories] = useState<CatalogCategory[]>(categories);

  const handleCreateCategory = async (data: CatalogCategoryFormData) => {
    setIsCreatingCategory(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('slug', data.slug || '');
      formData.append('code', data.code || '');
      formData.append('level', String(data.level || 1));
      formData.append('itemType', data.itemType || 'SERVICE');
      formData.append('status', data.status || 'ACTIVE');
      if (data.parentId) {
        formData.append('parentId', data.parentId);
      }

      const result = await createCategoryAction(formData);
      if (result.success && result.data) {
        const newCat = result.data as CatalogCategory;
        const formattedCat: CatalogCategory = {
          ...newCat,
          status: 'active'
        };
        setLocalCategories(prev => [...prev, formattedCat]);
        form.setValue('categoryId', newCat.id);
        setIsNewCategoryOpen(false);
        toast({
          title: 'Categoría creada',
          description: `La categoría "${data.name}" se creó y seleccionó correctamente.`,
        });
      } else {
        alert(result.error || 'Error al crear la categoría');
      }
    } catch (error) {
      logger.error('Error al crear categoría inline:', error);
      alert('Error inesperado al crear categoría');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const form = useForm<CatalogItemFormData>({
    resolver: zodResolver(CatalogItemFormSchema),
    defaultValues: item ? {
      name: item.name,
      type: (item.type?.toLowerCase() as 'service' | 'product' | 'equipment') || 'service',
      categoryId: item.categoryId,
      description: item.description || item.shortDescription || '',
      priceSuggested: item.priceSuggested ?? '',
      priceReferenceMin: item.priceReferenceMin ?? '',
      priceReferenceMax: item.priceReferenceMax ?? '',
      defaultMarginPercent: item.defaultMarginPercent ?? '',
      images: (item.images || []).map(img => ({ 
        ...img, 
        type: (img.type?.toLowerCase() as 'image' | 'video' | 'document') || 'image' 
      })),
      videos: (item.videos || []).map(vid => ({ 
        ...vid, 
        type: (vid.type?.toLowerCase() as 'image' | 'video' | 'document') || 'video' 
      })),
      documents: (item.documents || []).map(doc => ({ 
        ...doc, 
        type: (doc.type?.toLowerCase() as 'image' | 'video' | 'document') || 'document' 
      })),
      technicalSpecs: item.technicalSpecs || {},
      tags: item.tags || [],
      status: (item.status?.toLowerCase() as 'draft' | 'active' | 'archived') || 'draft',
      isFeatured: !!item.isFeatured,
      priceType: item.priceType || 'FIJO',
    } : {
      images: [],
      videos: [],
      documents: [],
      tags: [],
      status: 'draft',
      isFeatured: false,
      type: 'service',
      priceSuggested: '',
      priceReferenceMin: '',
      priceReferenceMax: '',
      defaultMarginPercent: '',
      description: '',
      name: '',
      categoryId: '',
      technicalSpecs: {},
      priceType: 'FIJO'
    },
  });

  const watchType = form.watch('type');
  const watchPriceType = form.watch('priceType') || 'FIJO';

  const onSubmit = async (data: CatalogItemFormData) => {
    setIsSubmittingForm(true);

    try {
      const formData = new FormData();
      
      // Agregar todos los campos validando tipos string/empty
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' || key === 'videos' || key === 'documents' || key === 'technicalSpecs' || key === 'tags') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      const result = item 
        ? await updateCatalogItemAction(item.id, formData)
        : await createCatalogItemAction(formData);

      if (result.success) {
        onSuccess?.();
      } else {
        alert(result.error + (result.details ? `\n${result.details}` : ''));
      }
    } catch (error) {
      logger.error('Error al enviar formulario:', error);
      alert('Error inesperado al guardar el item');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!item?.id) {
      alert('Debe guardar el item primero para generar marketing con IA');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const result = await generateMarketingAction(item.id);
      if (result.success && result.data) {
        // We suggest applying these changes
        const { seoTitle, metaDescription } = result.data;
        
        if (confirm(`IA sugiere:\nTítulo SEO: ${seoTitle}\nMeta: ${metaDescription}\n\n¿Deseas aplicar estos cambios al nombre y descripción?`)) {
          form.setValue('name', seoTitle);
          form.setValue('description', metaDescription);
        }
      } else {
        alert(result.error || 'Error al generar sugerencias');
      }
    } catch (error) {
      logger.error('AI Generation Failed', error);
      alert('Error en el servicio de IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="media">Multimedia</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>

          {/* TAB: Información Básica */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Nombre *</FormLabel>
                    {item && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-8 px-2"
                        onClick={handleAIGenerate}
                        disabled={isGeneratingAI}
                      >
                        {isGeneratingAI ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Wand2 className="h-4 w-4 mr-2" />
                        )}
                        Optimizar con IA
                      </Button>
                    )}
                  </div>
                  <FormControl>
                    <Input placeholder="Ej: Grúa Torre 50 toneladas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!item} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service">Servicio</SelectItem>
                        <SelectItem value="product">Producto</SelectItem>
                        <SelectItem value="equipment">Equipamiento</SelectItem>
                      </SelectContent>
                    </Select>
                    {item && (
                      <FormDescription>
                        El tipo no puede modificarse.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {localCategories
                              .filter(cat => cat.status === 'active' || cat.status === 'ACTIVE')
                              .map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="h-10 px-3 flex gap-1 items-center border-dashed border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                      <Plus className="h-4 w-4" />
                      <span>Nueva</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Nueva Categoría</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <CatalogCategoryForm
                        categories={localCategories}
                        onSubmit={handleCreateCategory}
                        isLoading={isCreatingCategory}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={5} 
                      placeholder="Descripción detallada del item..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Destacado</FormLabel>
                      <FormDescription>
                        Aparecerá en la Home.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* TAB: Multimedia */}
          <TabsContent value="media" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MediaUploader
                      value={field.value as MediaAsset[]}
                      onChange={field.onChange}
                      maxFiles={8}
                      label="Imágenes Principales (La #1 es la Portada)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videos"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MediaUploader
                      value={field.value as MediaAsset[]}
                      onChange={field.onChange}
                      maxFiles={3}
                      acceptedTypes={['video/mp4', 'video/webm']}
                      label="Videos Opcionales"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* TAB: Precios */}
          <TabsContent value="pricing" className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Tipo de Publicación de Precio</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('FIJO');
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          field.value === 'FIJO'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <DollarSign className="h-6 w-6 mb-2" />
                        <span className="font-semibold text-sm">Precio Fijo</span>
                        <span className="text-[11px] text-slate-500 mt-1">Se muestra un precio único exacto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('COTIZABLE');
                          form.setValue('priceSuggested', '');
                          form.setValue('priceReferenceMin', '');
                          form.setValue('priceReferenceMax', '');
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          field.value === 'COTIZABLE'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <FileText className="h-6 w-6 mb-2" />
                        <span className="font-semibold text-sm">Cotizable</span>
                        <span className="text-[11px] text-slate-500 mt-1">Requiere cotización personalizada</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          field.onChange('DESDE');
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          field.value === 'DESDE'
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <TrendingUp className="h-6 w-6 mb-2" />
                        <span className="font-semibold text-sm">Precio Desde</span>
                        <span className="text-[11px] text-slate-500 mt-1">Se muestra el precio base de inicio</span>
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPriceType !== 'COTIZABLE' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceSuggested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <span>Precio Público (CLP)</span>
                          <span className="text-destructive font-bold">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">$</span>
                            <Input 
                              type="number" 
                              step="1" 
                              placeholder="Ej: 1250000"
                              className="pl-7"
                              {...field} 
                              value={(field.value as any) ?? ''}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Monto de publicación principal. Sin decimales.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultMarginPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Margen Sugerido (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            min="0" 
                            max="100"
                            placeholder="Ej: 15"
                            {...field} 
                            value={(field.value as any) ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Margen de ganancia interna de referencia.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceReferenceMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rango Mínimo (CLP)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">$</span>
                            <Input 
                              type="number" 
                              step="1" 
                              placeholder="Ej: 1100000"
                              className="pl-7"
                              {...field} 
                              value={(field.value as any) ?? ''} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Precio mínimo de referencia comercial.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceReferenceMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rango Máximo (CLP)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">$</span>
                            <Input 
                              type="number" 
                              step="1" 
                              placeholder="Ej: 1500000"
                              className="pl-7"
                              {...field} 
                              value={(field.value as any) ?? ''} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Precio máximo de referencia comercial.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-center animate-in fade-in duration-200">
                <FileText className="h-10 w-10 text-slate-400 mb-2" />
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Publicación Tipo Cotizable Activa</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Los items configurados como cotizables no muestran precio público en el catálogo y requieren que el cliente solicite una cotización detallada. No se requieren valores numéricos.
                </p>
              </div>
            )}
          </TabsContent>

          {/* TAB: Avanzado */}
          <TabsContent value="advanced" className="space-y-4 pt-4">
            {watchType === 'equipment' && (
              <FormField
                control={form.control}
                name="technicalSpecs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especificaciones Técnicas (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        placeholder='{"capacidad": "50 toneladas", "alcance": "45 metros"}'
                        value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            field.onChange(parsed);
                          } catch {
                            // Ignorar errores de parsing temporalmente
                          }
                        }}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      Formato JSON obligatorio para equipamientos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (separados por coma)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="construcción, minería, izaje"
                      value={field.value?.join(', ') || ''}
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(',')
                          .map(t => t.trim())
                          .filter(t => t.length > 0);
                        field.onChange(tags);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-6 border-t mt-8">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmittingForm}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmittingForm}>
            {isSubmittingForm ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              item ? 'Actualizar Item' : 'Crear Item'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
