/**
 * FavoritesWrapper — RSC that fetches available services and passes to client FavoritesManager.
 */
import { createServiceRoleClient } from '@/lib/supabase/api';
import { FavoritesManager } from './favorites-manager';

interface FavoritesWrapperProps {
    userId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function FavoritesWrapper({ userId: _userId }: FavoritesWrapperProps) {
    const supabase = createServiceRoleClient();

    const { data } = await supabase
        .from('services')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('name')
        .limit(8);

    const services = (data ?? []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug ?? s.id,
        description: s.description ?? '',
    }));

    return <FavoritesManager availableServices={services} />;
}
