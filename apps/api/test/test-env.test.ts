import { it, expect } from 'vitest';
it('checks NODE_ENV', () => {
  expect(process.env.NODE_ENV).not.toBe('production');
});
