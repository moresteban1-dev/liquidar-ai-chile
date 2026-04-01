import { Entity } from '../../Entity';
import { Result, ok, fail } from '@core/shared/Result';
import { Money } from '../../value-objects/Money';

export interface QuotationProviderItemProps {
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPriceNet: Money;
    totalPriceNet: Money;
    sortOrder: number;
}

export class QuotationProviderItem extends Entity<QuotationProviderItemProps> {
    private constructor(props: QuotationProviderItemProps, id?: string) {
        super(props, id);
    }

    public static create(
        category: 'SERVICIO' | 'LOGISTICA',
        concept: string,
        unitPriceNet: Money,
        quantity: number = 1,
        sortOrder: number = 0
    ): Result<QuotationProviderItem, string> {
        if (!concept) return fail("Concept is required");
        if (quantity <= 0) return fail("Quantity must be positive");

        const totalPriceRes = unitPriceNet.multiply(quantity);
        if (totalPriceRes.isFailure()) return fail(totalPriceRes.getError());

        return ok(new QuotationProviderItem({
            category,
            concept,
            unitPriceNet,
            quantity,
            totalPriceNet: totalPriceRes.getValue(),
            sortOrder
        }));
    }

    public static reconstitute(props: QuotationProviderItemProps, id: string): QuotationProviderItem {
        return new QuotationProviderItem(props, id);
    }

    get category(): string { return this.props.category; }
    get concept(): string { return this.props.concept; }
    get quantity(): number { return this.props.quantity; }
    get unitPriceNet(): Money { return this.props.unitPriceNet; }
    get totalPriceNet(): Money { return this.props.totalPriceNet; }
    get sortOrder(): number { return this.props.sortOrder; }
}
