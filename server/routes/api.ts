import { createHash, timingSafeEqual } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import type { TickerLists } from '../../common/types/types.js';
import { InvalidTickerError, parseTickerList } from '../lib/tickers.js';
import type { TickerConfig } from '../services/tickerConfig.js';

type ListInput = string | string[] | undefined;

/** Read `stock`/`crypto` from a JSON body or, for curl convenience, the query string. */
function readLists(req: Request): Partial<TickerLists> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const pick = (name: 'stock' | 'crypto'): ListInput => (body[name] ?? req.query[name]) as ListInput;
  const change: Partial<TickerLists> = {};
  const stock = pick('stock');
  const crypto = pick('crypto');
  if (stock !== undefined) change.stock = parseTickerList(stock, 'STOCK');
  if (crypto !== undefined) change.crypto = parseTickerList(crypto, 'CRYPTO');
  return change;
}

const digest = (s: string) => createHash('sha256').update(s).digest();

/** Require `Authorization: Bearer <token>` when a token is configured. */
export function requireToken(token: string | undefined): RequestHandler {
  if (!token) return (_req, _res, next) => next();
  const expected = digest(token);
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const given = header.startsWith('Bearer ') ? header.slice(7) : '';
    // Compare fixed-length digests so neither content nor length leaks through timing.
    if (given && timingSafeEqual(digest(given), expected)) {
      next();
      return;
    }
    res.status(401).set('WWW-Authenticate', 'Bearer').json({ error: 'Unauthorized' });
  };
}

export function apiRouter(tickers: TickerConfig, adminToken: string | undefined): Router {
  const router = Router();
  const auth = requireToken(adminToken);

  // Lets the settings page check a token before editing: 200 when the token is
  // valid or none is configured (`required` says which), 401 otherwise.
  router.get('/auth', auth, (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ required: Boolean(adminToken) });
  });

  router.get('/tickers', (_req, res) => {
    res.json(tickers.get());
  });

  // Replace the stock and/or crypto list; a list left out is unchanged.
  router.put('/tickers', auth, async (req, res) => {
    const change = readLists(req);
    if (change.stock === undefined && change.crypto === undefined) {
      res.status(400).json({ error: 'Provide "stock" and/or "crypto"' });
      return;
    }
    res.json(await tickers.update(change));
  });

  router.delete('/tickers', auth, async (_req, res) => {
    res.json(await tickers.clear());
  });

  router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof InvalidTickerError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return router;
}
