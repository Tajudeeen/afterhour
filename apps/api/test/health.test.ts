import { describe, it, expect } from 'vitest';
import { app, health } from '../src/index.js';

describe('api health', () => {
  it('returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('afterhours-api');
  });

  it('health handler is exported', () => {
    expect(typeof health).toBe('function');
  });
});
