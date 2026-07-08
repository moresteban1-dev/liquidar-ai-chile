import { Entity } from '@shared/Entity';
import { Result } from '../../../shared/Result';
import { UniqueEntityID } from '@shared/UniqueEntityID';

export interface QuotationItemProps {
    description: string;
    quantity: number;
    category: 'SERVICE' | 'LOGISTICS' | 'OTHER';
}

export class QuotationItem extends Entity<QuotationItemProps> {
    private constructor(props: QuotationItemProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(description: string, quantity: number, category: 'SERVICE' | 'LOGISTICS' | 'OTHER' = 'SERVICE'): Result<QuotationItem> {
        if (quantity <= 0) {
            return Result.fail("Quantity must be greater than zero");
        }
        if (!description) {
            return Result.fail("Description is required");
        }

        return Result.ok<QuotationItem>(new QuotationItem({ description, quantity, category }));
    }

    public static reconstitute(props: QuotationItemProps, id: string): QuotationItem {
        return new QuotationItem(props, new UniqueEntityID(id));
    }

    get description(): string { return this.props.description; }
    get quantity(): number { return this.props.quantity; }
    get category(): string { return this.props.category; }
}
