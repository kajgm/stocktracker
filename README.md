# Stock Tracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kajgm/stocktracker/blob/master/LICENSE) [![Node.js CI](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml/badge.svg)](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A minimal tracker for Stocks and Cryptocurrencies. Intended for use on external Raspberry Pi based displays (3.5inch) or within a browser.

![Example](docs/example.png)

## Developed With

- [Node](https://nodejs.org/)
- [Vue](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind](https://tailwindcss.com/)

## Prerequisites

1. Please ensure the following software is installed

- [Node](https://nodejs.org/en/download)

2. (Optional) To display exchange-traded stock tickers (AAPL, MSFT, etc.), create a Finanical Modeling Prep API key

- [https://site.financialmodelingprep.com/](https://site.financialmodelingprep.com/)

## Project Setup

### Install client and server dependencies

```sh
cd client
npm install
cd ../server
npm install
```

### Create a `.env` file within `/client` (using .env.template) and add parameters

```
FMP_KEY="<your_api_key>"
```

### Compile and Hot-Reload for Development

```sh
cd client
npm run dev
```

### Start the configuration server

> Run in another terminal

```sh
cd server
npm run dev
```

### Type-Check, Compile and Minify Client for Production

```sh
npm run build
```

### Run Client Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test
```

### Lint Client with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Docker Deployment

To deploy within Docker, please follow these steps:

1. Install [Docker Engine](https://docs.docker.com/engine/install/)

   > Tip: Run `sudo usermod -aG docker <user>` to avoid prefixing the following commands with sudo

2. Create the `.env` files from the templates in `/client` and `/server`

3. Build the dockerfile within the `/client` directory

```sh
docker build -t kajgm/stocktracker-client .
```

4. Build the dockerfile within the `/server` directory

```sh
docker build -t kajgm/stocktracker-server .
```

5. Create a network for these containers

```sh
docker network create -d bridge backend-net
```

6. Run the client, server, and database containers

```sh
docker run -d -p 8080:80 --name stocktracker-client --network backend-net --restart always kajgm/stocktracker-client
docker run -d -p 3000:3000 --name stocktracker-server --network backend-net --env-file=./.env --restart always kajgm/stocktracker-server
docker run -d --name mongodb-server --network backend-net -v stocktracker:/data/db --restart always mongo
```

## Deployment on Raspberry Pi

Ensure the Docker deployment steps from above are followed on the target Raspberry Pi

1. (Optional) Install chromium browser version 88
   > For whatever reason the latest version of chromium-browser sometimes doesn't play nice. If you're running into issues with the next few commands, try installing this version.

```sh
wget "http://archive.raspberrypi.org/debian/pool/main/c/chromium-browser/chromium-browser_88.0.4324.187-rpt1_armhf.deb"
wget "http://archive.raspberrypi.org/debian/pool/main/c/chromium-browser/chromium-codecs-ffmpeg-extra_88.0.4324.187-rpt1_armhf.deb"
apt install --no-install-recommends --allow-downgrades --allow-change-held-packages ./chromium-browser_88.0.4324.187-rpt1_armhf.deb ./chromium-codecs-ffmpeg-extra_88.0.4324.187-rpt1_armhf.deb
```

2. If running these commands over ssh, export the display

```sh
export DISPLAY=:0
```

3. Run chromium in fullscreen mode

```sh
chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito
```

> Alternatively, you may have to append `nohup` and `&` to run the command in the background (if executing via ssh):

```sh
nohup chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito &
```

As an alternative, a startup script has been provided in the root directory `./startup`. Ensure that the script is executable before running or referencing in any automated startup routine.

```sh
chmod +x <username>
```
