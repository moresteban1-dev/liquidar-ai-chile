import { Entity } from '../../Entity';
import { Result, ok } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';
import { BidItem } from './BidItem';

export interface ProviderBidProps {
    providerId: string;
    items: BidItem[];
    deliveryDays: number;
    notes?: string;
    createdAt: Date;
}

export class ProviderBid extends Entity<ProviderBidProps> {
    private constructor(props: ProviderBidProps, id?: string) {
        super(props, id);
    }

    public static create(
        providerId: string,
        items: BidItem[],
        deliveryDays: number,
        notes?: string
    ): Result<ProviderBid, AppError> {
        return ok(new ProviderBid({
            providerId,
            items,
            deliveryDays,
            notes,
            createdAt: new Date()
        }));
    }

    public static reconstitute(props: ProviderBidProps, id: string): Result<ProviderBid, AppError> {
        return ok(new ProviderBid(props, id));
    }

    get providerId(): string { return this.props.providerId; }
    get items(): BidItem[] { return this.props.items; }
    get deliveryDays(): number { return this.props.deliveryDays; }
    get notes(): string | undefined { return this.props.notes; }
    get createdAt(): Date { return this.props.createdAt; }

    // Logic helper for mapper result pattern compatibility if needed
    public isFailure(): boolean { return false; }
    public getValue(): ProviderBid { return this; }
}
