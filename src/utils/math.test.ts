import { describe, it, expect } from 'vitest';

// Simple math function for testing setup
const add = (a: number, b: number) => a + b;

describe('Math utilities', () => {
  it('should correctly add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
