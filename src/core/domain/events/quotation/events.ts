import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { QuotationStatus } from '../../aggregates/quotation/QuotationStatus';

export class QuotationStatusChanged extends DomainEvent {
    constructor(
        public readonly quotationId: string,
        public readonly clientId: string,
        public readonly oldStatus: QuotationStatus,
        public readonly newStatus: QuotationStatus,
        public readonly quotationCode: string
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.quotationId);
    }
}

export class QuotationBidReceived extends DomainEvent {
    constructor(
        public readonly quotationId: string,
        public readonly providerId: string,
        public readonly bidAmount: number
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.quotationId);
    }
}
