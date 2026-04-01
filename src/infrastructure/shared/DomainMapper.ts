/**
 * NASA-Grade Engineering: DomainMapper Interface
 * 
 * Provides a standardized contract for data transformation between
 * the Domain layer (Entities) and the Infrastructure layer (Persistence Objects).
 * Prevents Domain leakage into the Database schema.
 */
export interface DomainMapper<DomainEntity, PersistenceObject> {
  /**
   * Transforms a database record into a Domain Entity.
   */
  toDomain(raw: PersistenceObject): DomainEntity;

  /**
   * Transforms a Domain Entity into a database-friendly record.
   */
  toPersistence(entity: DomainEntity): PersistenceObject;
}
