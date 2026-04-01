import { Quotation } from '@core/domain/aggregates/quotation/Quotation';
import { Result } from '@core/shared/Result';
import { UniqueEntityID } from '@core/shared/UniqueEntityID';
import { AppError } from '@core/shared/AppError';

/**
 * IQuotationRepository - Port
 * 
 * Canonical contract for managing RFPs and Quotations (V2).
 */
export interface IQuotationRepository {
    /**
     * Persists a quotation aggregate.
     */
    save(quotation: Quotation): Promise<Result<void, AppError>>;
    
    /**
     * Retrieves a quotation by its ID.
     */
    findById(id: UniqueEntityID): Promise<Result<Quotation | null, AppError>>;
    
    /**
     * Lists all quotations associated with a specific order/service.
     */
    findByOrder(orderId: UniqueEntityID): Promise<Result<Quotation[], AppError>>;
    
    /**
     * Lists all quotations submitted by or assigned to a specific provider.
     */
    findByProvider(providerId: UniqueEntityID): Promise<Result<Quotation[], AppError>>;
    
    /**
     * Performs a soft delete on a quotation.
     */
    delete(id: UniqueEntityID): Promise<Result<void, AppError>>;
    
    /**
     * Retrieves the client's email associated with a specific client ID.
     */
    getClientEmail(clientId: string): Promise<Result<string | null, AppError>>;

    /**
     * Retrieves a specialized view for the client panel.
     */
    getClientQuotationView(quotationId: string, clientId: string): Promise<any>;

    /**
     * Retrieves a specialized view for the admin panel.
     */
    getAdminQuotationView(quotationId: string): Promise<Result<any, AppError>>;

    /**
     * Updates internal notes for a quotation.
     */
    updateInternalNotes(quotationId: string, notes: string): Promise<Result<void, AppError>>;
}
