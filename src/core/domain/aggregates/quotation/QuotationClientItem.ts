import { Entity } from '../../Entity';
import { Result, ok, fail } from '@core/shared/Result';
import { Money } from '../../value-objects/Money';

export interface QuotationClientItemProps {
    description: string;
    quantity: number;
    unitPriceNet: Money;
    totalPriceNet: Money;
    sortOrder: number;
}

export class QuotationClientItem extends Entity<QuotationClientItemProps> {
    private constructor(props: QuotationClientItemProps, id?: string) {
        super(props, id);
    }

    public static create(
        description: string,
        unitPriceNet: Money,
        quantity: number = 1,
        sortOrder: number = 0
    ): Result<QuotationClientItem, string> {
        if (!description) return fail("Description is required");
        if (quantity <= 0) return fail("Quantity must be positive");

        const totalPriceRes = unitPriceNet.multiply(quantity);
        if (totalPriceRes.isFailure()) return fail(totalPriceRes.getError());

        return ok(new QuotationClientItem({
            description,
            unitPriceNet,
            quantity,
            totalPriceNet: totalPriceRes.getValue(),
            sortOrder
        }));
    }

    public static reconstitute(props: QuotationClientItemProps, id: string): QuotationClientItem {
        return new QuotationClientItem(props, id);
    }

    get description(): string { return this.props.description; }
    get quantity(): number { return this.props.quantity; }
    get unitPriceNet(): Money { return this.props.unitPriceNet; }
    get totalPriceNet(): Money { return this.props.totalPriceNet; }
    get sortOrder(): number { return this.props.sortOrder; }
}
