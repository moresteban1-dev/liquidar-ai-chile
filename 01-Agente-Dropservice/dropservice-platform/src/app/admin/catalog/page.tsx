import { getCatalogItems, getCatalogCategories } from '@/actions/catalog';
import { CatalogManager } from '@/components/admin/catalog/CatalogManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCatalogPage() {
    // Fetch initial data server-side
    const items = await getCatalogItems();
    const categories = await getCatalogCategories();

    return (
        <div className="container mx-auto py-8 px-4">
            <CatalogManager 
                initialItems={items.success ? items.data : []} 
                initialCategories={categories.success ? categories.data : []} 
            />
        </div>
    );
}
