import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { apiRouter } from '../routes/api.js';
import { TickerConfig } from '../services/tickerConfig.js';

async function withApi(adminToken: string | undefined, fn: (base: string) => Promise<void>) {
  const app = express().use('/api', apiRouter(new TickerConfig({ stock: [], crypto: [] }), adminToken));
  const server = app.listen(0);
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api`);
  } finally {
    server.close();
  }
}

const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

describe('GET /api/auth', () => {
  it('accepts only the configured token', async () => {
    await withApi('s3cret', async (base) => {
      const ok = await fetch(`${base}/auth`, bearer('s3cret'));
      assert.equal(ok.status, 200);
      assert.deepEqual(await ok.json(), { required: true });
      assert.equal((await fetch(`${base}/auth`, bearer('wrong'))).status, 401);
      assert.equal((await fetch(`${base}/auth`)).status, 401);
    });
  });

  it('says no token is needed when none is configured', async () => {
    await withApi(undefined, async (base) => {
      const res = await fetch(`${base}/auth`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { required: false });
    });
  });
});
