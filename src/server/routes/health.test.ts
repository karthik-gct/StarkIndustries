import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

const app = createApp();

describe('GET /api/health', () => {
  it('AC-4: returns 200 with status ok and version', async () => {
    const res = await supertest(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.version).toBe('string');
    expect(res.body.version.length).toBeGreaterThan(0);
  });

  it('AC-1: createApp() produces a valid Express app without binding a port', () => {
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });
});
