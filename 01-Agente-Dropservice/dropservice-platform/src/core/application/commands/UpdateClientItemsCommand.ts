import { ICommand } from './ICommand';

export interface UpdateClientItemsCommand extends ICommand {
  quotationId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    sortOrder: number;
  }>;
}
