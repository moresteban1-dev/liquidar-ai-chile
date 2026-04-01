export type Brand<K, T> = K & { readonly _brand: T };

export type OrderId = Brand<string, 'OrderId'>;
export type UserId = Brand<string, 'UserId'>;
export type ServiceId = Brand<string, 'ServiceId'>;
export type ProviderId = Brand<string, 'ProviderId'>;

export function makeOrderId(id: string): OrderId {
    return id as OrderId;
}

export function makeUserId(id: string): UserId {
    return id as UserId;
}

export function makeServiceId(id: string): ServiceId {
    return id as ServiceId;
}
