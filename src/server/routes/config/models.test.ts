import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';
import { createApp } from '../../index.js';

const FIXTURE: Record<string, unknown> = {
  routing_backend: 'direct',
  agents: {
    prod_mgmt: { model_id: 'claude-sonnet-4-6', provider: 'anthropic', stark_task_type: 'reasoning' },
    design:    { model_id: 'claude-sonnet-4-6', provider: 'anthropic', stark_task_type: 'reasoning' },
    code:      { model_id: 'claude-sonnet-4-6', provider: 'anthropic', stark_task_type: 'code' },
    quality:   { model_id: 'claude-sonnet-4-6', provider: 'anthropic', stark_task_type: 'code' },
    prod_eval: { model_id: 'claude-haiku-4-5-20251001', provider: 'anthropic', stark_task_type: 'fast' },
    dev_eval:  { model_id: 'claude-haiku-4-5-20251001', provider: 'anthropic', stark_task_type: 'fast' },
  },
};

let tmpDir: string;
let configPath: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scrum9-test-'));
  configPath = path.join(tmpDir, 'models.config.yaml');
  await fs.writeFile(configPath, yaml.dump(FIXTURE));
  process.env.MARK3_ROOT = tmpDir;
  delete process.env.STARK_ENDPOINT;
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  delete process.env.MARK3_ROOT;
});

const app = () => createApp();

// AC-1: GET returns routing_backend + all 6 agent rows
describe('GET /api/config/models', () => {
  it('AC-1: returns routing_backend and all six agent rows', async () => {
    const res = await request(app()).get('/api/config/models');
    expect(res.status).toBe(200);
    expect(res.body.routing_backend).toBe('direct');
    const agents = Object.keys(res.body.agents);
    expect(agents).toHaveLength(6);
    expect(agents).toContain('prod_mgmt');
    expect(agents).toContain('dev_eval');
  });

  it('returns starkEndpointConfigured: false when STARK_ENDPOINT unset', async () => {
    const res = await request(app()).get('/api/config/models');
    expect(res.body.starkEndpointConfigured).toBe(false);
  });

  it('returns starkEndpointConfigured: true when STARK_ENDPOINT set', async () => {
    process.env.STARK_ENDPOINT = 'http://192.168.10.2:8000';
    const res = await request(app()).get('/api/config/models');
    expect(res.body.starkEndpointConfigured).toBe(true);
  });

  it('returns 404 when models.config.yaml missing', async () => {
    await fs.unlink(configPath);
    const res = await request(app()).get('/api/config/models');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('CONFIG_NOT_FOUND');
  });

  it('returns 422 when models.config.yaml malformed', async () => {
    await fs.writeFile(configPath, '{{ invalid yaml: [');
    const res = await request(app()).get('/api/config/models');
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('CONFIG_MALFORMED');
  });
});

// AC-2: PUT routing_backend: "stark" writes to file
describe('PUT /api/config/models', () => {
  it('AC-2: writes routing_backend: stark to file', async () => {
    const res = await request(app()).put('/api/config/models').send({ routing_backend: 'stark' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const written = yaml.load(await fs.readFile(configPath, 'utf8')) as Record<string, unknown>;
    expect(written.routing_backend).toBe('stark');
  });

  // AC-4: only targeted agent's model_id is updated; stark_task_type preserved
  it('AC-4: only updates the targeted agent model_id, preserves stark_task_type', async () => {
    const res = await request(app())
      .put('/api/config/models')
      .send({ agents: { prod_mgmt: { model_id: 'claude-opus-4-8' } } });
    expect(res.status).toBe(200);
    const written = yaml.load(await fs.readFile(configPath, 'utf8')) as { agents: Record<string, { model_id: string; stark_task_type?: string }> };
    expect(written.agents['prod_mgmt']!.model_id).toBe('claude-opus-4-8');
    // stark_task_type preserved
    expect(written.agents['prod_mgmt']!.stark_task_type).toBe('reasoning');
    // other agents untouched
    expect(written.agents['dev_eval']!.model_id).toBe('claude-haiku-4-5-20251001');
  });

  it('returns 400 for invalid routing_backend value', async () => {
    const res = await request(app()).put('/api/config/models').send({ routing_backend: 'openai' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_INPUT');
  });

  // AC-6: STARK warning is advisory — save still works
  it('AC-6: save succeeds even when routing is stark and STARK_ENDPOINT is empty', async () => {
    delete process.env.STARK_ENDPOINT;
    const res = await request(app()).put('/api/config/models').send({ routing_backend: 'stark' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
