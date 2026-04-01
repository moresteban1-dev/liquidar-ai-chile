/**
 * ValueObject is a base class for domain objects that are defined by their attributes
 * rather than a unique identity. Two value objects are considered equal if their
 * properties are equal.
 */
export abstract class ValueObject<T> {
  protected readonly props: T

  constructor(props: T) {
    this.props = Object.freeze(props)
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false
    }
    if (vo.props === undefined) {
      return false
    }
    return JSON.stringify(this.props) === JSON.stringify(vo.props)
  }
}
