import { ICommand } from './ICommand';

export interface UpdateRequestedItemsCommand extends ICommand {
  quotationId: string;
  items: Array<{
    itemName: string;
    quantity: number;
    sortOrder: number;
  }>;
}
