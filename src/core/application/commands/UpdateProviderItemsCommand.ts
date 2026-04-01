import { ICommand } from './ICommand';

export interface UpdateProviderItemsCommand extends ICommand {
  quotationId: string;
  items: Array<{
    category: 'SERVICIO' | 'LOGISTICA';
    concept: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    sortOrder: number;
  }>;
}
