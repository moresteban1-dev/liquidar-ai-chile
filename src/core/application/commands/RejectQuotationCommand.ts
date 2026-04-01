import { ICommand } from './ICommand';

/**
 * RejectQuotationCommand
 * 
 * Cliente rechaza cotización recibida
 */
export interface RejectQuotationCommand extends ICommand {
  commandName: 'RejectQuotation';
  quotationId: string;
  clientId: string;
  reason: string;
  clientNotes?: string | undefined;
}
