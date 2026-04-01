import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProviderInventoryService } from './ProviderInventoryService';
import { ProviderInventoryRepository } from '../ports/ProviderInventoryRepository';
import {
    ProviderInventoryItem,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    InventoryStats,
    ProviderMatch
} from '../../domain/provider/ProviderInventoryTypes';

// ─── Mock Repository ────────────────────────────────────────────────────────

function createMockRepo(): ProviderInventoryRepository {
    return {
        getInventoryByProviderId: vi.fn(),
        getItem: vi.fn(),
        saveItem: vi.fn(),
        toggleAvailability: vi.fn(),
        deleteItem: vi.fn(),
        getStats: vi.fn(),
        findMatchesForItem: vi.fn(),
    };
}

function createSampleItem(overrides: Partial<ProviderInventoryItem> = {}): ProviderInventoryItem {
    return {
        id: 'inv-001',
        providerId: 'prov-1',
        itemId: 'cat-item-1',
        costPerUnit: 50000,
        availableQuantity: 10,
        isAvailable: true,
        minRentalDays: 1,
        advanceBookingDays: 3,
        equipmentCondition: 'GOOD',
        equipmentYear: 2024,
        notes: 'Test item',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

// ─── addItem: Validaciones ──────────────────────────────────────────────────

describe('ProviderInventoryService.addItem', () => {
    let service: ProviderInventoryService;
    let repo: ProviderInventoryRepository;

    beforeEach(() => {
        repo = createMockRepo();
        service = new ProviderInventoryService(repo);
    });

    it('should add a valid item', async () => {
        const savedItem = createSampleItem();
        (repo.saveItem as ReturnType<typeof vi.fn>).mockResolvedValue(savedItem);

        const result = await service.addItem({
            providerId: 'prov-1',
            itemId: 'cat-item-1',
            costPerUnit: 50000,
        });

        expect(result).toEqual(savedItem);
        expect(repo.saveItem).toHaveBeenCalledOnce();
    });

    it('should throw if providerId is missing', async () => {
        await expect(
            service.addItem({ itemId: 'cat-item-1', costPerUnit: 100 })
        ).rejects.toThrow('ProviderId e ItemId son obligatorios');
    });

    it('should throw if itemId is missing', async () => {
        await expect(
            service.addItem({ providerId: 'prov-1', costPerUnit: 100 })
        ).rejects.toThrow('ProviderId e ItemId son obligatorios');
    });

    it('should throw if costPerUnit is negative', async () => {
        await expect(
            service.addItem({ providerId: 'prov-1', itemId: 'cat-1', costPerUnit: -10 })
        ).rejects.toThrow('costo por unidad');
    });

    it('should throw if costPerUnit is undefined', async () => {
        await expect(
            service.addItem({ providerId: 'prov-1', itemId: 'cat-1' })
        ).rejects.toThrow('costo por unidad');
    });

    it('should default status to ACTIVE', async () => {
        const savedItem = createSampleItem();
        (repo.saveItem as ReturnType<typeof vi.fn>).mockImplementation(
            (item: Partial<ProviderInventoryItem>) => Promise.resolve({ ...savedItem, ...item })
        );

        await service.addItem({
            providerId: 'prov-1',
            itemId: 'cat-item-1',
            costPerUnit: 50000,
        });

        const callArg = (repo.saveItem as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArg.status).toBe('ACTIVE');
        expect(callArg.isAvailable).toBe(true);
    });

    it('should respect explicit isAvailable = false', async () => {
        const savedItem = createSampleItem({ isAvailable: false });
        (repo.saveItem as ReturnType<typeof vi.fn>).mockResolvedValue(savedItem);

        await service.addItem({
            providerId: 'prov-1',
            itemId: 'cat-item-1',
            costPerUnit: 50000,
            isAvailable: false,
        });

        const callArg = (repo.saveItem as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(callArg.isAvailable).toBe(false);
    });
});

// ─── updateItem: Validaciones ───────────────────────────────────────────────

describe('ProviderInventoryService.updateItem', () => {
    let service: ProviderInventoryService;
    let repo: ProviderInventoryRepository;

    beforeEach(() => {
        repo = createMockRepo();
        service = new ProviderInventoryService(repo);
    });

    it('should update an existing item', async () => {
        const existing = createSampleItem();
        (repo.getInventoryByProviderId as ReturnType<typeof vi.fn>).mockResolvedValue([existing]);
        (repo.saveItem as ReturnType<typeof vi.fn>).mockImplementation(
            (item: Partial<ProviderInventoryItem>) => Promise.resolve(item as ProviderInventoryItem)
        );

        const result = await service.updateItem('inv-001', 'prov-1', { costPerUnit: 75000 });

        expect(result.costPerUnit).toBe(75000);
        expect(repo.saveItem).toHaveBeenCalledOnce();
    });

    it('should throw if item is not found in provider inventory', async () => {
        (repo.getInventoryByProviderId as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        await expect(
            service.updateItem('inv-999', 'prov-1', { costPerUnit: 75000 })
        ).rejects.toThrow('no encontrado');
    });
});

// ─── suggestProvidersForRFP: Motor de Matching ──────────────────────────────

describe('ProviderInventoryService.suggestProvidersForRFP', () => {
    let service: ProviderInventoryService;
    let repo: ProviderInventoryRepository;

    beforeEach(() => {
        repo = createMockRepo();
        service = new ProviderInventoryService(repo);
    });

    it('should return a map with matches for each item', async () => {
        const matches: ProviderMatch[] = [
            {
                providerId: 'prov-1', companyName: 'Audio Pro', rating: 4.5,
                city: 'Santiago', costPerUnit: 50000, availableQuantity: 10
            },
            {
                providerId: 'prov-2', companyName: 'Sound Fx', rating: 4.0,
                city: 'Viña', costPerUnit: 45000, availableQuantity: 5
            },
        ];
        (repo.findMatchesForItem as ReturnType<typeof vi.fn>).mockResolvedValue(matches);

        const result = await service.suggestProvidersForRFP([
            { itemId: 'cat-audio-001', quantity: 2 }
        ]);

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(1);
        const itemMatches = result.get('cat-audio-001')!;
        expect(itemMatches).toHaveLength(2);
    });

    it('should sort matches by rating (desc) then cost (asc)', async () => {
        const matches: ProviderMatch[] = [
            {
                providerId: 'prov-cheap', companyName: 'Budget', rating: 3.0,
                costPerUnit: 30000, availableQuantity: 10
            },
            {
                providerId: 'prov-best', companyName: 'Best Choice', rating: 5.0,
                costPerUnit: 50000, availableQuantity: 10
            },
            {
                providerId: 'prov-mid', companyName: 'Mid-Range', rating: 5.0,
                costPerUnit: 40000, availableQuantity: 10
            },
        ];
        (repo.findMatchesForItem as ReturnType<typeof vi.fn>).mockResolvedValue(matches);

        const result = await service.suggestProvidersForRFP([
            { itemId: 'cat-item-1', quantity: 1 }
        ]);

        const sorted = result.get('cat-item-1')!;
        // Highest rating first
        expect(sorted[0].providerId).toBe('prov-mid'); // 5.0 rating, $40k (cheaper)
        expect(sorted[1].providerId).toBe('prov-best'); // 5.0 rating, $50k
        expect(sorted[2].providerId).toBe('prov-cheap'); // 3.0 rating
    });

    it('should handle empty matches gracefully', async () => {
        (repo.findMatchesForItem as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const result = await service.suggestProvidersForRFP([
            { itemId: 'cat-rare-item', quantity: 1 }
        ]);

        expect(result.get('cat-rare-item')).toEqual([]);
    });

    it('should handle multiple items independently', async () => {
        (repo.findMatchesForItem as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce([{
                providerId: 'p1', companyName: 'A', rating: 5,
                costPerUnit: 100, availableQuantity: 1
            }])
            .mockResolvedValueOnce([]); // No matches for second item

        const result = await service.suggestProvidersForRFP([
            { itemId: 'item-a', quantity: 1 },
            { itemId: 'item-b', quantity: 3 }
        ]);

        expect(result.size).toBe(2);
        expect(result.get('item-a')).toHaveLength(1);
        expect(result.get('item-b')).toHaveLength(0);
    });
});
