export type Factory<T> = () => T | Promise<T>;

export interface RegistrationOptions {
  singleton?: boolean;
}

export interface IContainer {
  register<T>(key: string, factory: Factory<T>, options?: RegistrationOptions): void;
  resolve<T>(key: string): Promise<T>;
  has(key: string): boolean;
}
