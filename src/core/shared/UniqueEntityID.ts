import { crypto } from '@/lib/shared/crypto';

export class UniqueEntityID {
  private readonly _value: string

  constructor(id?: string) {
    this._value = id || crypto.randomUUID()
  }

  get value(): string {
    return this._value
  }

  public toString(): string {
    return this._value
  }

  public equals(id?: UniqueEntityID): boolean {
    if (id === null || id === undefined) {
      return false
    }
    if (!(id instanceof UniqueEntityID)) {
      return false
    }
    return id.value === this._value
  }
}
