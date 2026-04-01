import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

export class OrderCreated extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly clientId: string,
        public readonly serviceId: string,
        public readonly price: { amount: number; currency: string }
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}

export class OrderAssigned extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly providerId: string
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}

export class OrderDelivered extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly providerId: string
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}

export class OrderCompleted extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly clientId: string,
        public readonly providerId: string,
        public readonly payoutAmount: { amount: number; currency: string },
        public readonly platformFee: { amount: number; currency: string }
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}

export class OrderDisputed extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly reason: string
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}

