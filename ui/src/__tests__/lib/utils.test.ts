import { formatSalaryRange } from '../../lib/utils';

describe('formatSalaryRange', () => {
  it('should format both min and max when both are provided', () => {
    expect(formatSalaryRange(50000, 100000)).toBe('$50,000 - $100,000');
  });

  it('should format only min when only min is provided', () => {
    expect(formatSalaryRange(50000, undefined)).toBe('$50,000+');
  });

  it('should format only max when only max is provided', () => {
    expect(formatSalaryRange(undefined, 100000)).toBe('Up to $100,000');
  });

  it('should return empty string when both are undefined', () => {
    expect(formatSalaryRange(undefined, undefined)).toBe('');
  });

  it('should handle 0 as a valid min value', () => {
    expect(formatSalaryRange(0, 100000)).toBe('$0 - $100,000');
  });

  it('should handle 0 as a valid max value', () => {
    expect(formatSalaryRange(50000, 0)).toBe('$50,000 - $0');
  });

  it('should handle both min and max as 0', () => {
    expect(formatSalaryRange(0, 0)).toBe('$0 - $0');
  });

  it('should handle only min as 0', () => {
    expect(formatSalaryRange(0, undefined)).toBe('$0+');
  });

  it('should handle only max as 0', () => {
    expect(formatSalaryRange(undefined, 0)).toBe('Up to $0');
  });
});
