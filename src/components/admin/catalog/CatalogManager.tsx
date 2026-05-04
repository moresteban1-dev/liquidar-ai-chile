'use client';

import { useState, useEffect } from 'react';
import { CatalogItem, CatalogCategory } from '@core/domain/catalog/CatalogTypes';
import { CatalogItemForm } from './CatalogItemForm';
import { 
  getCatalogItemsAction, 
  getCategoriesAction,
  deleteCatalogItemAction,
  publishCatalogItemAction,
  unpublishCatalogItemAction,
  archiveCatalogItemAction
} from '@/actions/catalog';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Archive,
  Loader2 
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

interface CatalogManagerProps {
  initialItems?: any[];
  initialCategories?: any[];
}

export function CatalogManager({ initialItems = [], initialCategories = [] }: CatalogManagerProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems as CatalogItem[]);
  const [categories, setCategories] = useState<CatalogCategory[]>(initialCategories as CatalogCategory[]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itemsResult, categoriesResult] = await Promise.all([
        getCatalogItemsAction(statusFilter !== 'all' ? { statusFilter } : undefined),
        getCategoriesAction()
      ]);

      if (itemsResult.success && itemsResult.data) {
        setItems(itemsResult.data);
      } else {
        toast({
          title: 'Error',
          description: itemsResult.error || 'Error al cargar items',
          variant: 'destructive',
        });
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    } catch (error) {
      logger.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(undefined);
    loadData();
    toast({
      title: 'Catálogo Actualizado',
      description: 'Los cambios se guardaron correctamente.',
    });
  };

  const handlePublish = async (itemId: string) => {
    if (!confirm('¿Deseas publicar este item para que sea visible por los clientes?')) return;
    const result = await publishCatalogItemAction(itemId);
    if (result.success) loadData();
    else alert(result.error);
  };

  const handleUnpublish = async (itemId: string) => {
    if (!confirm('¿Despublicar este item? Ya no será visible.')) return;
    const result = await unpublishCatalogItemAction(itemId);
    if (result.success) loadData();
    else alert(result.error);
  };

  const handleArchive = async (itemId: string) => {
    if (!confirm('¿Archivar este item? Se ocultará completamente.')) return;
    const result = await archiveCatalogItemAction(itemId);
    if (result.success) loadData();
    else alert(result.error);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar permanentemente este item? Esta acción no se puede deshacer.')) return;
    const result = await deleteCatalogItemAction(itemId);
    if (result.success) loadData();
    else alert(result.error);
  };

  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || '-';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo Maestro</h2>
          <p className="text-muted-foreground">Adminitra los items disponibles.</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Item
        </Button>
      </div>

      <div className="flex gap-2 bg-muted/50 p-2 rounded-lg">
        {(['all', 'active', 'draft', 'archived'] as const).map(f => (
          <Button
            key={f}
            variant={statusFilter === f ? 'default' : 'ghost'}
            onClick={() => setStatusFilter(f)}
            size="sm"
            className="capitalize"
          >
            {f === 'all' ? 'Todos' : f}
          </Button>
        ))}
      </div>

      <div className="border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-20">Media</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Categoría / Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Precio Referencia</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center border-b-0">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground border-b-0">
                  No se encontraron items.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="group">
                  <TableCell>
                    <div className="relative w-12 h-12 bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                      {item.images && item.images.length > 0 && item.images[0]?.url ? (
                        <Image src={item.images[0].url} alt={item.name || 'Item image'} fill className="object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No img</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{(item.slug || '').substring(0, 30)}...</div>
                    {item.isFeatured && (
                      <Badge variant="secondary" className="mt-1 text-[10px] px-1 py-0 h-4">Destacado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getCategoryName(item.categoryId)}</div>
                    <div className="text-xs capitalize text-muted-foreground">{item.type}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'active' ? 'default' : item.status === 'draft' ? 'outline' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.priceReferenceMin ? (
                      <span className="text-sm font-medium">{item.priceReferenceMin} - {item.priceReferenceMax} UF</span>
                    ) : item.priceSuggested ? (
                      <span className="text-sm font-medium">{item.priceSuggested} UF</span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>

                      {item.status === 'draft' && (
                        <Button variant="ghost" size="icon" onClick={() => handlePublish(item.id)} title="Publicar">
                          <Eye className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      {item.status === 'active' && (
                        <Button variant="ghost" size="icon" onClick={() => handleUnpublish(item.id)} title="Ocultar (Borrador)">
                          <EyeOff className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}

                      {item.status !== 'archived' && (
                        <Button variant="ghost" size="icon" onClick={() => handleArchive(item.id)} title="Archivar">
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}

                      {(item.status === 'draft' || item.status === 'archived') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title="Eliminar definitivamente">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Catalog Item' : 'Crear Nuevo Item'}
            </DialogTitle>
          </DialogHeader>
          <CatalogItemForm
            item={editingItem}
            categories={categories}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
