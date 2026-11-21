import { Router, type Request, type Response, type NextFunction } from 'express';
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

export function apiRouter(tickers: TickerConfig): Router {
  const router = Router();

  router.get('/tickers', (_req, res) => {
    res.json(tickers.get());
  });

  // Replace the stock and/or crypto list; a list left out is unchanged.
  router.put('/tickers', async (req, res) => {
    const change = readLists(req);
    if (change.stock === undefined && change.crypto === undefined) {
      res.status(400).json({ error: 'Provide "stock" and/or "crypto"' });
      return;
    }
    res.json(await tickers.update(change));
  });

  router.delete('/tickers', async (_req, res) => {
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
