import { ICommand } from './ICommand';

/**
 * SendQuotationToClientCommand
 * 
 * Admin envía cotización al cliente después de revisarla
 */
export interface SendQuotationToClientCommand extends ICommand {
  commandName: 'SendQuotationToClient';
  quotationId: string;
  adminId: string;
  adminNotes?: string | undefined;
}
