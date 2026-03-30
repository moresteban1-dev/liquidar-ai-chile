import { DomainEvent } from '@core/shared/DomainEvent';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';

export class OrderPaid extends DomainEvent {
    constructor(
        public readonly orderId: string,
        public readonly amountPaid: number,
        public readonly date: Date
    ) {
        super();
    }

    public getAggregateId(): UniqueEntityID {
        return new UniqueEntityID(this.orderId);
    }
}
