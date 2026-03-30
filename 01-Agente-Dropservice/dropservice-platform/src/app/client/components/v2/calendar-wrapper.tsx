/**
 * CalendarWrapper — Server Component that fetches events and passes to client calendar.
 */
import { getClientCalendarEvents } from '@/lib/dashboard/client-data.service';
import { EventCalendar } from './event-calendar';

interface CalendarWrapperProps {
    userId: string;
}

export async function CalendarWrapper({ userId }: CalendarWrapperProps) {
    const events = await getClientCalendarEvents(userId);
    return <EventCalendar events={events} />;
}
