import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { QuotationStatus } from './QuotationStatus';
import { QuotationProviderItem } from './QuotationProviderItem';
import { QuotationClientItem } from './QuotationClientItem';

export class QuotationRequested extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly clientId: string,
        public readonly serviceId: string,
        public readonly eventDate: Date,
        public readonly expiresAt: Date
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class QuotationStatusChanged extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly oldStatus: QuotationStatus,
        public readonly newStatus: QuotationStatus
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class ProviderAssigned extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly providerId: string
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class MarginApplied extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly markupPercentage: number,
        public readonly priceNet: number,
        public readonly priceTotal: number
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class QuotationBidReceived extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly providerId: string,
        public readonly amount: number
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class QuotationAccepted extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly bidId: string
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}

export class AISuggestionsApplied extends DomainEvent {
    constructor(
        public readonly aggregateId: string,
        public readonly providerItems: QuotationProviderItem[],
        public readonly clientItems: QuotationClientItem[]
    ) { super(); }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.aggregateId);
    }
}
