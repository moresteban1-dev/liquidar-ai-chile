import { describe, it, expect } from 'vitest';
import { EventType } from './EventType';

describe('EventType', () => {
  const validProps = {
    id: 'evt_123',
    code: 'CORP_WORKSHOP',
    name: 'Corporate Workshop',
    description: 'A professional training session',
    baseCategory: 'EDUCATION',
    isActive: true
  };

  it('should create a valid EventType', () => {
    const result = EventType.create(validProps);
    expect(result.isSuccess()).toBe(true);
    const eventType = result.getValue();
    expect(eventType.id).toBe(validProps.id);
    expect(eventType.code).toBe(validProps.code);
    expect(eventType.name).toBe(validProps.name);
    expect(eventType.isActive).toBe(true);
  });

  it('should return failure if code is empty', () => {
    const result = EventType.create({ ...validProps, code: '' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EventType: code is required');
  });

  it('should return failure if name is empty', () => {
    const result = EventType.create({ ...validProps, name: ' ' });
    expect(result.isFailure()).toBe(true);
    expect(result.getError()).toBe('EventType: name is required');
  });

  it('should reconstitute an EventType', () => {
    const eventType = EventType.reconstitute(validProps);
    expect(eventType.toJSON()).toEqual(validProps);
  });
});
