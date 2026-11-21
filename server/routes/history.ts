import { Router } from 'express';
import type { HistoryRange, TickerHistory, TickerType } from '../../common/types/types.js';
import { RANGES, type HistoryStore } from '../services/historyStore.js';
import type { TickerConfig } from '../services/tickerConfig.js';

const TYPES: Record<string, TickerType> = { stock: 'STOCK', crypto: 'CRYPTO' };
const MAX_POINTS = 1_000;

/**
 * GET /api/history/:type/:symbol?range=1d&points=300
 * Only configured tickers are served, so the endpoint can't be used to probe
 * arbitrary symbols.
 */
export function historyRouter(history: HistoryStore, tickers: TickerConfig): Router {
  const router = Router();

  router.get('/:type/:symbol', (req, res) => {
    const type = TYPES[req.params.type.toLowerCase()];
    const symbol = req.params.symbol.toUpperCase();
    const range = (req.query.range ?? '1d') as HistoryRange;
    const points = Number(req.query.points ?? 300);

    if (!type) {
      res.status(400).json({ error: 'type must be "stock" or "crypto"' });
      return;
    }
    if (!(range in RANGES)) {
      res.status(400).json({ error: `range must be one of ${Object.keys(RANGES).join(', ')}` });
      return;
    }
    if (!Number.isInteger(points) || points < 2 || points > MAX_POINTS) {
      res.status(400).json({ error: `points must be an integer from 2 to ${MAX_POINTS}` });
      return;
    }
    const lists = tickers.get();
    if (!(type === 'STOCK' ? lists.stock : lists.crypto).includes(symbol)) {
      res.status(404).json({ error: `${symbol} is not a configured ${type.toLowerCase()} ticker` });
      return;
    }

    const body: TickerHistory = { symbol, type, range, points: history.get(type, symbol, range, points) };
    res.set('Cache-Control', 'no-store').json(body);
  });

  return router;
}
