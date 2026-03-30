import { ICommand } from './ICommand';

/**
 * ApproveQuotationCommand
 * 
 * Cliente aprueba cotización recibida
 */
export interface ApproveQuotationCommand extends ICommand {
  commandName: 'ApproveQuotation';
  quotationId: string;
  clientId: string;
  clientNotes?: string | undefined;
}
