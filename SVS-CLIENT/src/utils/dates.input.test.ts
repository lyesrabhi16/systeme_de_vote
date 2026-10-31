import { describe, expect, it } from 'vitest';
import { fromInputValue, parseInputValue, toInputValue } from './dates';

describe('the value of a date and time field', () => {
  it('is the wall clock of the person, and goes back to the same moment', () => {
    const moment = new Date(2030, 10, 5, 18, 30); // 5 Nov 2030 18:30 where the test runs, whatever the timezone
    expect(toInputValue(moment)).toBe('2030-11-05T18:30');
    expect(new Date(fromInputValue('2030-11-05T18:30')).getTime()).toBe(moment.getTime());
    expect(fromInputValue(toInputValue(moment))).toBe(moment.toISOString());
  });

  it('is not shifted by the timezone offset (the editor used to subtract it, and the election opened at another hour than the one chosen)', () => {
    const chosen = '2030-11-05T00:00';
    expect(new Date(fromInputValue(chosen)).getHours()).toBe(0); // read back on the same wall clock: midnight stays midnight
  });

  it('may end at the end of a day: the time is part of the value', () => {
    expect(toInputValue(new Date(2030, 10, 5, 23, 59))).toBe('2030-11-05T23:59');
  });

  it('knows an empty or broken value is nothing', () => {
    expect(parseInputValue('')).toBeNull();
    expect(parseInputValue('not a date')).toBeNull();
    expect(parseInputValue('2030-11-05T18:30')).toBeInstanceOf(Date);
  });
});
