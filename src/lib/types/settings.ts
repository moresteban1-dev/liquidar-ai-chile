export interface OrganizationSettings {
    id: string;
    company_name: string;
    contact_email: string;
    whatsapp_number: string;
    legal_name?: string;
    legal_rut?: string;
    bank_name?: string;
    account_type?: string;
    account_number?: string;
    updated_at: string;
}

export type OrganizationSettingsUpdate = Partial<Omit<OrganizationSettings, 'id' | 'updated_at'>>;
