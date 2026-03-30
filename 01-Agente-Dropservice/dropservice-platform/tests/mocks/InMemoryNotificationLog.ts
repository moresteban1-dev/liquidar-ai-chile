export interface NotificationLogEntry {
  id: string;
  eventId: string;
  eventType: string;
  channel: string;
  recipientId?: string;
  recipientEmail?: string;
  templateId?: string;
  status: string;
  provider?: string;
  error?: string;
  durationMs?: number;
  sentAt?: string;
  createdAt: string;
}

export class InMemoryNotificationLog {
  private entries: NotificationLogEntry[] = [];

  add(entry: Omit<NotificationLogEntry, 'id' | 'createdAt'>): void {
    this.entries.push({
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }

  getAll(): NotificationLogEntry[] {
    return [...this.entries];
  }

  getByChannel(channel: string): NotificationLogEntry[] {
    return this.entries.filter((e) => e.channel === channel);
  }

  getByStatus(status: string): NotificationLogEntry[] {
    return this.entries.filter((e) => e.status === status);
  }

  getByEventType(eventType: string): NotificationLogEntry[] {
    return this.entries.filter((e) => e.eventType === eventType);
  }

  get count(): number {
    return this.entries.length;
  }

  get sentCount(): number {
    return this.entries.filter((e) => e.status === 'sent').length;
  }

  get failedCount(): number {
    return this.entries.filter((e) => e.status === 'failed').length;
  }

  reset(): void {
    this.entries = [];
  }
}
