import { Router, Request, Response } from 'express';
import path from 'node:path';
import { readYaml, writeYaml, FileNotFoundError, YamlParseError } from '../../lib/fileio/index.js';
import type { ModelsConfig, ModelsConfigResponse } from '../../types/modelsConfig.js';

function getConfigPath() {
  const root = process.env.MARK3_ROOT ?? path.resolve(process.cwd(), '../..');
  return path.join(root, 'models.config.yaml');
}

const modelsRouter = Router();

modelsRouter.get('/', async (_req: Request, res: Response) => {
  const CONFIG_PATH = getConfigPath();
  try {
    const config = await readYaml<ModelsConfig>(CONFIG_PATH);
    const response: ModelsConfigResponse = {
      ...config,
      starkEndpointConfigured: !!(process.env.STARK_ENDPOINT?.trim()),
    };
    res.json(response);
  } catch (err) {
    if (err instanceof FileNotFoundError) {
      res.status(404).json({ error: 'CONFIG_NOT_FOUND', message: 'models.config.yaml not found' });
    } else if (err instanceof YamlParseError) {
      res.status(422).json({ error: 'CONFIG_MALFORMED', message: 'Config file is malformed — fix manually' });
    } else {
      res.status(500).json({ error: 'INTERNAL', message: String(err) });
    }
  }
});

modelsRouter.put('/', async (req: Request, res: Response) => {
  const CONFIG_PATH = getConfigPath();
  const body = req.body as Partial<ModelsConfig>;

  if (body.routing_backend !== undefined &&
      body.routing_backend !== 'direct' &&
      body.routing_backend !== 'stark') {
    res.status(400).json({ error: 'INVALID_INPUT', message: 'routing_backend must be "direct" or "stark"' });
    return;
  }

  let existing: ModelsConfig;
  try {
    existing = await readYaml<ModelsConfig>(CONFIG_PATH);
  } catch (err) {
    if (err instanceof FileNotFoundError) {
      res.status(404).json({ error: 'CONFIG_NOT_FOUND', message: 'models.config.yaml not found' });
    } else if (err instanceof YamlParseError) {
      res.status(422).json({ error: 'CONFIG_MALFORMED', message: 'Config file is malformed — fix manually' });
    } else {
      res.status(500).json({ error: 'INTERNAL', message: String(err) });
    }
    return;
  }

  // Deep-merge: only update keys present in request body; preserve all others (stark_task_type, etc.)
  const merged: ModelsConfig = {
    ...existing,
    ...(body.routing_backend !== undefined ? { routing_backend: body.routing_backend } : {}),
    agents: { ...existing.agents },
  };

  if (body.agents) {
    for (const [key, partial] of Object.entries(body.agents)) {
      if (merged.agents[key]) {
        merged.agents[key] = { ...merged.agents[key], ...partial };
      }
    }
  }

  try {
    await writeYaml(CONFIG_PATH, merged);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'WRITE_FAILED', message: String(err) });
  }
});

export default modelsRouter;
