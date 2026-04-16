export interface QuoterState {
    [key: string]: any;
    eventType: string;
    eventSubtype: string;
    date: Date | null;
    isFlexibleDate: boolean;
    location: string;
    venueStatus: 'TENGO_RECINTO' | 'NECESITO_RECINTO' | 'POR_DEFINIR';
    attendees: number;
    duration: '4H' | '8H' | 'MULTIPLE';
    selectedServices: string[];
    customServices: string[];
    budget: number;
    priorities: string[];
    isSustainable: boolean;
    needsPermits: 'SI_TODO' | 'SOLO_ASESORIA' | 'NO';
    comments: string;
    leadName: string;
    leadEmail: string;
    leadPhone: string;
    leadCompany: string;
    contactPreferences: ('EMAIL' | 'WHATSAPP' | 'PHONE')[];
}

export const initialState: QuoterState = {
    eventType: '',
    eventSubtype: '',
    date: null,
    isFlexibleDate: false,
    location: '',
    venueStatus: 'POR_DEFINIR',
    attendees: 150,
    duration: '8H',
    selectedServices: [],
    customServices: [],
    budget: 5000000,
    priorities: [],
    isSustainable: false,
    needsPermits: 'NO',
    comments: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    leadCompany: '',
    contactPreferences: ['EMAIL', 'WHATSAPP']
};
