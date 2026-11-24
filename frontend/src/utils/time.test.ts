import { describe, it, expect } from 'vitest';
import { timeToMinutes } from './time';

describe('timeToMinutes', () => {
  it('переводит 10:30 в 630 минут', () => {
    expect(timeToMinutes('10:30')).toBe(630);
  });

  it('переводит полночь в 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('переводит 08:00 в 480', () => {
    expect(timeToMinutes('08:00')).toBe(480);
  });
});
