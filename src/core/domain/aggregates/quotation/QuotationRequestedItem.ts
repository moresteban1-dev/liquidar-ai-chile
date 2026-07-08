import { Entity } from '@shared/Entity';
import { Result } from '../../../shared/Result';
import { UniqueEntityID } from '@shared/UniqueEntityID';

export interface QuotationRequestedItemProps {
    itemName: string;
    quantity: number;
    sortOrder: number;
}

export class QuotationRequestedItem extends Entity<QuotationRequestedItemProps> {
    private constructor(props: QuotationRequestedItemProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(itemName: string, quantity: number = 1, sortOrder: number = 0): Result<QuotationRequestedItem> {
        if (!itemName) return Result.fail("Item name is required");
        if (quantity < 1) return Result.fail("Quantity must be at least 1");

        return Result.ok(new QuotationRequestedItem({ itemName, quantity, sortOrder }));
    }

    public static reconstitute(props: QuotationRequestedItemProps, id: string): QuotationRequestedItem {
        return new QuotationRequestedItem(props, new UniqueEntityID(id));
    }

    get itemName(): string { return this.props.itemName; }
    get quantity(): number { return this.props.quantity; }
    get sortOrder(): number { return this.props.sortOrder; }
}
