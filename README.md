# Stock Tracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kajgm/stocktracker/blob/master/LICENSE) [![Node.js CI](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml/badge.svg)](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A minimal tracker for Stocks and Cryptocurrencies. Intended for use on external Raspberry Pi based displays (3.5inch) or within a browser.

![Example](docs/example.png)

## Developed With

- [Node](https://nodejs.org/)
- [Vue](https://vuejs.org/)
- [Vite](https://vitejs.dev/)

## Prerequisites

1. Please ensure the following software is installed

- [Node 18.x](https://nodejs.org/en/download)

2. (Optional) To display exchange-traded stock tickers (AAPL, MSFT, etc.), create a Finanical Modeling Prep API key

- [https://site.financialmodelingprep.com/](https://site.financialmodelingprep.com/)

## Project Setup

### Install dependencies

```sh
npm install
```

### Create a `.env` file within `client/` (using .env.template) and add parameters

```
FMP_KEY="<your_api_key>"
STOCK_TICKERS="MSFT,AAPL,NVDA,AMD,INTC,AMZN"
CRYPTO_TICKERS="ETH-USD,BTC-USD"
```

### Compile and Hot-Reload for Development

```sh
cd client
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Docker Deployment

To deploy within Docker, please follow these steps:

1. Install [Docker Engine](https://docs.docker.com/engine/install/)

2. Build the dockerfile within the client directory
   > Tip: Run `sudo usermod -aG docker <user>` to avoid prefixing the following commands with sudo

```
docker build -t kajgr/stocktracker .
```

3. Run the dockerfile

```
docker run -d -p 8080:80 --name stock-tracker-1 kajgr/stocktracker
```

## Deployment on Raspberry Pi

Ensure the Docker deployment steps from above are followed on the target Raspberry Pi

1. (Optional) Install chromium browser version 88
   > For whatever reason the latest version of chromium-browser sometimes doesn't play nice. If you're running into issues with the next few commands, try installing this version.

```
wget "http://archive.raspberrypi.org/debian/pool/main/c/chromium-browser/chromium-browser_88.0.4324.187-rpt1_armhf.deb"
wget "http://archive.raspberrypi.org/debian/pool/main/c/chromium-browser/chromium-codecs-ffmpeg-extra_88.0.4324.187-rpt1_armhf.deb"
apt install --no-install-recommends --allow-downgrades --allow-change-held-packages ./chromium-browser_88.0.4324.187-rpt1_armhf.deb ./chromium-codecs-ffmpeg-extra_88.0.4324.187-rpt1_armhf.deb
```

2. If running these commands over ssh, export the display

```
export DISPLAY=:0
```

3. Run chromium in fullscreen mode

```
chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito
```

> Alternatively, you may have to append `nohup` and `&` to run the command in the background (if executing via ssh):

```
nohup chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito &
```

### Troubleshooting

- To prevent the screen from going to sleep, use the command (may have to use `export DISPLAY=:0` beforehand):

```
xset s 0
xset -dpms
```
