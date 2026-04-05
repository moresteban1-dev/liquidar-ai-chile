import { ICommand } from '@core/shared/ICommand'

export interface CreateQuotationRequestCommand extends ICommand {
    commandName: 'CreateQuotationRequest'
    // Client Info
    clientName: string
    clientRut: string
    clientEmail: string
    clientPhone: string
    
    // Event details
    eventDate: string | Date
    serviceId?: string
    categoryId?: string
    brief: string
    items?: { serviceId: string, quantity: number }[]
    needsTechnicalVisit: boolean
    
    // Logistics
    venueAddress: string
    mountingTime: string
    eventStartTime: string
    eventEndTime: string
    dismountingTime: string
    
    // Metadata
    clientId?: string 
}
