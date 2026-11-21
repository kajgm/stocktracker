# Stock Tracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kajgm/stocktracker/blob/master/LICENSE) [![Node.js CI](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml/badge.svg)](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A minimal full-stack tracker for Stocks and Cryptocurrencies. Intended for use on external Raspberry Pi based displays (3.5inch) or within a browser. Created to be deployed at scale.

![Example](docs/example.png)

## How it works

| Part | What it does |
|---|---|
| `server/` | Express + Socket.IO. Polls [Finnhub](https://finnhub.io/) for stock quotes and streams crypto prices from Coinbase's public WebSocket, then pushes updates to every connected display. |
| `client/` | Vue single-page app that renders the tickers. Connects to the server over Socket.IO. |
| Ticker storage (optional) | Keeps ticker lists changed through the API across restarts: a JSON file (`TICKERS_FILE`) or MongoDB. Without it, the lists come from environment variables on every start. |

Stocks are re-quoted every minute while the US market is open (09:30-16:00 New York time, daylight saving aware) and once at startup, so the last close shows outside market hours. Crypto updates stream continuously and are batched to at most two updates per second per ticker.

On the display, the price and arrow follow the day's change (green up, red down). Stocks outside market hours get a **Closed** tag and show which session the price is from (for example "Fri close"). A tile that has had no update for a few minutes while its feed should be live fades and shows how long ago it last updated. Tiles flash briefly when the price moves, at most every 5 seconds.

Built with [Node](https://nodejs.org/), [Vue](https://vuejs.org/), [Vite](https://vitejs.dev/), [Tailwind](https://tailwindcss.com/), [Express](https://expressjs.com/), [Socket.IO](https://socket.io/) and optionally [MongoDB](https://www.mongodb.com/) (a JSON file works too).

## Prerequisites

- [Node](https://nodejs.org/en/download) 22 or later (CI and the `.nvmrc` use Node 26)
- For stock tickers: a free [Finnhub API key](https://finnhub.io/register). The free plan allows 60 calls per minute and covers US-listed stocks; other exchanges (e.g. TSX) need a paid plan. Crypto needs no key.

## Configuration

Copy `server/.env.template` to `server/.env` and fill it in.

| Variable | Default | Description |
|---|---|---|
| `FINNHUB_API_KEY` | (none) | Finnhub key. Without it, stock tickers stay on "Connecting...". |
| `STOCK_TICKERS` | (none) | Comma-separated US stock symbols, e.g. `AAPL,MSFT` |
| `CRYPTO_TICKERS` | (none) | Comma-separated Coinbase products, e.g. `BTC-USD,ETH-USD` |
| `STOCK_POLL_INTERVAL_MS` | `60000` | Stock refresh interval during market hours. Stretched automatically to stay under 60 calls/minute. |
| `TICKERS_FILE` | (none) | JSON file that keeps ticker lists changed through the API across restarts, e.g. `/data/tickers.json` on a volume. Created on the first change. |
| `MONGO_URI` | (none) | Keep ticker lists in MongoDB instead. Set `TICKERS_FILE` or `MONGO_URI`, not both. |
| `PORT` | `3000` | Server port |
| `ADMIN_TOKEN` | (none) | When set, `PUT`/`DELETE /api/tickers` need `Authorization: Bearer <token>`. Set it whenever the server is reachable by others. |
| `CORS_ORIGINS` | `http://localhost:8080,http://localhost:5173` | Browser origins allowed to connect directly. Not needed behind the client image or the dev server, which proxy to the server. |

The client connects to its own origin: the client image (nginx) and the Vite dev server both proxy `/api` and `/socket.io` to the server. To point a build at a server on another origin instead, set `VITE_SERVER_URL` at build time (see `client/.env.template`).

### Changing tickers at runtime

Through the client container use `http://localhost:8080/api/...`, or your public hostname. Omit the `Authorization` header when `ADMIN_TOKEN` is not set.

```sh
curl http://localhost:3000/api/tickers                                   # current lists
curl -X PUT http://localhost:3000/api/tickers -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"stock": ["AAPL", "NVDA"]}'     # replace the stock list
curl -X PUT http://localhost:3000/api/tickers -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"crypto": "BTC-USD,SOL-USD"}'   # replace the crypto list
curl -X DELETE http://localhost:3000/api/tickers -H "Authorization: Bearer $ADMIN_TOKEN"   # clear both
```

A list left out of a `PUT` is unchanged. Connected displays update immediately.

With `TICKERS_FILE` or `MONGO_URI` set, changes are saved and survive restarts. Once anything is saved, it replaces `STOCK_TICKERS`/`CRYPTO_TICKERS`, which only seed the first start; the server logs which one it used. To go back to the environment lists, delete the saved file (or the MongoDB document) and restart. Without either, changes last until the server restarts.

## Development

Install dependencies in both packages, then run the server and client in separate terminals:

```sh
cd server && npm install && npm run dev    # http://localhost:3000
cd client && npm install && npm run dev    # http://localhost:5173, proxies to :3000
```

| Task | Client (`client/`) | Server (`server/`) |
|---|---|---|
| Lint | `npm run lint` | |
| Type-check | `npm run typecheck` | `npm run typecheck` |
| Unit tests | `npm test` | `npm test` |
| Production build | `npm run build` | `npm run build` (then `npm start`) |

## Container images

Two images, both built from the repository root:

| Image | Dockerfile | Port | User | Health check | Notes |
|---|---|---|---|---|---|
| `stocktracker-client` | [client/Dockerfile](client/Dockerfile) | `8080` | nginx, uid `101` | `GET /healthz` | Serves the UI and proxies `/api` and `/socket.io` to `SERVER_UPSTREAM` (default `stocktracker-server:3000`). Writes only to `/tmp` and `/etc/nginx/conf.d` (the config is rendered from a template at start). |
| `stocktracker-server` | [server/Dockerfile](server/Dockerfile) | `3000` | node, uid `1000` | `GET /healthz` | Configured with the environment variables above. Writes nothing to disk. |

Because the client proxies to the server, the browser only ever talks to one origin: expose the **client** and keep the server internal.

Both images run with a read-only root filesystem and are published for `linux/amd64` and `linux/arm64`.

### Published images

[GitHub Actions](.github/workflows/image.yml) builds and smoke-tests both images on every pull request, and publishes them to `ghcr.io/kajgm/stocktracker-client` and `ghcr.io/kajgm/stocktracker-server`:

| Trigger | Tags |
|---|---|
| Push to `main` | `main`, `sha-<short>` |
| Git tag `vX.Y.Z` | `X.Y.Z`, `X.Y` |

To release a version:

```sh
git tag v1.0.0
git push origin v1.0.0
```

Pin deployments to an `X.Y.Z` tag rather than `main`.

## Deploying with Docker

1. Install [Docker Engine](https://docs.docker.com/engine/install/) (on a Raspberry Pi, follow the [Debian instructions](https://docs.docker.com/engine/install/debian/)).

   > Tip: run `sudo usermod -aG docker $USER` and log back in to use Docker without `sudo`.

2. Create `server/.env` from `server/.env.template` and add your Finnhub key and tickers.

3. Start both containers with [compose.yaml](compose.yaml):

   ```sh
   docker compose up -d
   ```

4. Open <http://localhost:8080> and check health with `curl http://localhost:8080/healthz`.

Ticker changes made through the API are saved to `/data/tickers.json` on the `stocktracker-data` volume, so they survive restarts and upgrades. To start over from `STOCK_TICKERS`/`CRYPTO_TICKERS`, run `docker compose down -v` (this deletes the volume) and start again.

## Deploying on Kubernetes

Run the two images as separate Deployments, each with a Service:

| Workload | Service | Port | Needs |
|---|---|---|---|
| server | `stocktracker-server:3000` | `3000` | Secret with `FINNHUB_API_KEY` and `ADMIN_TOKEN`; initial tickers via env or ConfigMap. To keep API changes across restarts, set `TICKERS_FILE=/data/tickers.json` and mount a small `ReadWriteOnce` PVC at `/data` (use the `Recreate` strategy, since only one pod can mount it). Egress: DNS, and HTTPS (443) to `finnhub.io` and `ws-feed.exchange.coinbase.com`. |
| client | `stocktracker-client:80` → `8080` | `8080` | Egress to the server Service only. `emptyDir` volumes on `/tmp` and `/etc/nginx/conf.d` for a read-only root filesystem. |

Notes:

- **Exposure:** route your ingress, Gateway API `HTTPRoute` or tunnel to the **client** Service only. WebSockets must be allowed (Socket.IO falls back to long-polling if not).
- **Public access:** set `ADMIN_TOKEN` so only you can change tickers; the display itself is read-only.
- **Replicas:** run one server replica. Each replica polls Finnhub separately, so two replicas double API usage, and with in-memory or file storage each one keeps its own ticker list.
- **Network policies:** policies match pod ports (`8080`, `3000`), not Service ports.
- **Upgrades:** change the image tags. Displays reconnect automatically when the server restarts, and load the new UI on their next page reload.

## Raspberry Pi kiosk

The Pi only needs Chromium to show the app. Run the containers on the Pi itself (see [Deploying with Docker](#deploying-with-docker)), or point the Pi at an instance hosted elsewhere.

[startup.sh](startup.sh) opens the app full-screen in Chromium. It works with both `chromium` (Raspberry Pi OS Bookworm and later) and `chromium-browser` (older releases), and reads the URL from `STOCKTRACKER_URL`, defaulting to `http://localhost:8080/`:

```sh
chmod +x startup.sh
./startup.sh                                                 # local containers
STOCKTRACKER_URL=https://stocks.example.com/ ./startup.sh    # hosted instance
```

The script sets `DISPLAY=:0`, so it also works over SSH.

### Start on boot

Create `~/.config/autostart/stocktracker.desktop` (replace `<username>`, and drop the `env ...` part when using local containers):

```ini
[Desktop Entry]
Version=1.0
Type=Application
Terminal=false
Exec=env STOCKTRACKER_URL=https://stocks.example.com/ /home/<username>/stocktracker/startup.sh
Name=stocktracker
```

> If the hosted instance is behind an authentication proxy (for example an SSO login page), the kiosk can't sign in by itself. Allow the Pi's network without login, or serve it from an internal address.

## Troubleshooting

**A stock tile shows an error.** The tile shows the reason: `FINNHUB_API_KEY not set`, or `HTTP 401`/`403` for a bad key or a symbol outside the free plan (non-US exchanges).

**A ticker shows "Unknown symbol".** The symbol is unknown to Finnhub or Coinbase. Stock symbols are US listings (`AAPL`); crypto uses Coinbase product ids (`BTC-USD`).

**The screen shows "Server unreachable, retrying...".** The browser can't reach `/socket.io` on the page's origin: check that the server container is running and that your proxy or tunnel allows WebSockets.

**The screen goes blank after a while.** Disable screen blanking:

```sh
sudo raspi-config
# 2 Display Options > D2 Screen Blanking > No > Finish
```
