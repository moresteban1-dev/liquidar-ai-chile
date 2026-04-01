import { Result, ok } from '@/core/shared/Result';
import { IQuotationRepository } from '@app/ports/IQuotationRepository';
import { Quotation } from '@/core/domain/aggregates/quotation/Quotation';
import { UniqueEntityID } from '@/core/shared/UniqueEntityID';
import { AppError } from '@/core/shared/AppError';

export class InMemoryQuotationRepository implements IQuotationRepository {
  private quotations: Map<string, Quotation> = new Map();

  async findById(id: UniqueEntityID): Promise<Result<Quotation | null, AppError>> {
    const quotation = this.quotations.get(id.toString());
    return ok(quotation || null);
  }

  async save(quotation: Quotation): Promise<Result<void, AppError>> {
    this.quotations.set(quotation.quotationId.toString(), quotation);
    return ok(undefined);
  }

  async findByOrder(orderId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    const filtered = Array.from(this.quotations.values()).filter(q => q.orderId.equals(orderId));
    return ok(filtered);
  }

  async findByProvider(providerId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    const filtered = Array.from(this.quotations.values()).filter(q => q.providerId.equals(providerId));
    return ok(filtered);
  }

  async findLatestByOrderId(orderId: UniqueEntityID): Promise<Result<Quotation | null, AppError>> {
    const filtered = Array.from(this.quotations.values())
      .filter(q => q.orderId.equals(orderId))
      .sort((a, b) => b.props.createdAt.getTime() - a.props.createdAt.getTime());
    
    return ok(filtered.length > 0 ? filtered[0]! : null);
  }

  async delete(id: UniqueEntityID): Promise<Result<void, AppError>> {
    this.quotations.delete(id.toString());
    return ok(undefined);
  }

  async getClientQuotationView(_quotationId: string, _clientId: string): Promise<any> {
    return { id: _quotationId, items: [] };
  }

  async getAdminQuotationView(_quotationId: string): Promise<any> {
    return { id: _quotationId, items: [] };
  }

  async getClientEmail(_clientId: string): Promise<Result<string | null, AppError>> {
    return ok('test-client@example.com');
  }

  async update(quotation: Quotation): Promise<Result<void, AppError>> {
    return this.save(quotation);
  }

  async findByOrderId(orderId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    return this.findByOrder(orderId);
  }

  async findByProviderId(providerId: UniqueEntityID): Promise<Result<Quotation[], AppError>> {
    return this.findByProvider(providerId);
  }

  async updateInternalNotes(_quotationId: string, _notes: string): Promise<Result<void, AppError>> {
      return ok(undefined);
  }
}
