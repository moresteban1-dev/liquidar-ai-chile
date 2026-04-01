/**
 * Provider Aggregate Stub
 * 
 * Placeholder for the Provider aggregate root.
 * TODO: Evolve with full domain logic as needed.
 */
import { AggregateRoot } from '@core/shared/AggregateRoot';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { DomainEvent } from '@core/shared/DomainEvent';

export interface ProviderProps {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
    expertise?: string[];
    rating?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class Provider extends AggregateRoot<ProviderProps> {
    private constructor(props: ProviderProps, id?: UniqueEntityID) {
        super(props, id);
    }

    get providerId(): UniqueEntityID {
        return this._id;
    }

    get name(): string {
        return this.props.name;
    }

    get companyName(): string {
        return this.props.companyName;
    }

    get email(): string {
        return this.props.email;
    }

    get isActive(): boolean {
        return this.props.isActive;
    }

    public static create(props: Omit<ProviderProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Provider {
        return new Provider({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, id);
    }

    public static reconstitute(props: ProviderProps, id: UniqueEntityID): Provider {
        return new Provider(props, id);
    }

    protected applyEvent(_event: DomainEvent): void {
        // Extension point for event sourcing
    }
}
