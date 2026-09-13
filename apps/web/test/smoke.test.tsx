import { describe, it, expect } from 'vitest';

describe('web app', () => {
  it('exports dashboard page component', async () => {
    const mod = await import('../app/page');
    expect(typeof mod.default).toBe('function');
  });
});
