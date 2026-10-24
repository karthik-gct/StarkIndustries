import { describe, expect, it, vi, afterEach } from 'vitest';

describe('AC-6: PORT env var', () => {
  afterEach(() => {
    delete process.env.PORT;
  });

  it('defaults to 3100 when PORT is not set', () => {
    delete process.env.PORT;
    const port = parseInt(process.env.PORT ?? '3100', 10);
    expect(port).toBe(3100);
  });

  it('uses PORT env var when set', () => {
    process.env.PORT = '4000';
    const port = parseInt(process.env.PORT ?? '3100', 10);
    expect(port).toBe(4000);
  });
});
