import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { randomString, sleep, omit, pick, formatBytes, debounce, isDefined } from '../helpers';

describe('randomString', () => {
  it('should generate a string of the specified length', () => {
    expect(randomString(10)).toHaveLength(10);
    expect(randomString(5)).toHaveLength(5);
    expect(randomString(0)).toHaveLength(0);
  });

  it('should contain only alphanumeric characters', () => {
    const str = randomString(100);
    expect(str).toMatch(/^[A-Za-z0-9]*$/);
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after the specified time', async () => {
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('omit', () => {
  it('should omit specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['a'])).toEqual({ b: 2, c: 3 });
    expect(omit(obj, ['a', 'c'])).toEqual({ b: 2 });
  });

  it('should return a new object without mutating the original', () => {
    const obj = { a: 1, b: 2 };
    const result = omit(obj, ['a']);
    expect(obj).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(obj);
  });
});

describe('pick', () => {
  it('should pick specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a'])).toEqual({ a: 1 });
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('should ignore keys that do not exist', () => {
    const obj = { a: 1, b: 2 };
    expect(pick(obj, ['a', 'c' as keyof typeof obj])).toEqual({ a: 1 });
  });
});

describe('formatBytes', () => {
  it('should format bytes to human readable string', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should handle decimal precision', () => {
    expect(formatBytes(1500, 2)).toBe('1.46 KB');
    expect(formatBytes(1500, 0)).toBe('1 KB');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('isDefined', () => {
  it('should return true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
  });

  it('should return false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});
