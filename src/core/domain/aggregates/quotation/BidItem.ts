
import { Entity } from '@shared/Entity';
import { Money } from '../../value-objects/Money';
import { Result } from '../../../shared/Result';
import { UniqueEntityID } from '@shared/UniqueEntityID';

export interface BidItemProps {
    description: string;
    quantity: number;
    unitPrice: Money;
    category: 'SERVICE' | 'LOGISTICS' | 'OTHER';
}

export class BidItem extends Entity<BidItemProps> {
    private constructor(props: BidItemProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(
        description: string,
        quantity: number,
        unitPrice: Money,
        category: 'SERVICE' | 'LOGISTICS' | 'OTHER' = 'SERVICE'
    ): Result<BidItem> {
        if (quantity <= 0) return Result.fail("Quantity must be positive");

        return Result.ok(new BidItem({ description, quantity, unitPrice, category }));
    }

    get total(): Money {
        return this.props.unitPrice.multiply(this.props.quantity).value;
    }

    public calculateTotal(): Result<Money> {
        return this.props.unitPrice.multiply(this.props.quantity);
    }

    public static reconstitute(props: BidItemProps, id: string): BidItem {
        return new BidItem(props, new UniqueEntityID(id));
    }

    get description(): string { return this.props.description; }
    get quantity(): number { return this.props.quantity; }
    get unitPrice(): Money { return this.props.unitPrice; }
}
