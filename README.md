# Stock Tracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kajgm/stocktracker/blob/master/LICENSE) [![Node.js CI](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml/badge.svg)](https://github.com/kajgm/stocktracker/actions/workflows/node.js.yml) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A minimal full-stack tracker for Stocks and Cryptocurrencies. Intended for use on external Raspberry Pi based displays (3.5inch) or within a browser. Created to be deployed at scale.

![Example](docs/example.png)

## Developed With

- [Node](https://nodejs.org/)
- [Vue](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)

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

To deploy with Docker, please follow these steps:

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

5. Create a bridge network

```sh
docker network create -d bridge backend-net
```

6. Run the client, server, and database containers
   > Note: If running on a Raspberry Pi, you will need to download an alternative mongodb image. Please see steps under [Deployment on Raspberry Pi](#deployment-on-raspberry-pi)

```sh
docker run -d -p 8080:80 --name stocktracker-client --network backend-net --restart always kajgm/stocktracker-client
docker run -d -p 3000:3000 --name stocktracker-server --network backend-net --env-file=./.env --restart always kajgm/stocktracker-server
docker run -d --name mongodb-server --network backend-net -v stocktracker:/data/db --restart always mongo
```

## Deployment on Raspberry Pi

Ensure the Docker deployment steps from above are followed on the target Raspberry Pi

1. Mongodb currently does not support the ARM architecure used on Raspberry Pis. Please use the alternative image provided by themattman [mongodb-raspberrypi-docker](https://github.com/themattman/mongodb-raspberrypi-docker?tab=readme-ov-file#how-to-install)

2. If running these commands over ssh set the $DISPLAY environment variable

```sh
export DISPLAY=:0
```

3. Run chromium in fullscreen mode

```sh
chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito
```

> Alternatively, you may need to append `nohup` and `&` to run the command in the background (if executing via ssh):

```sh
nohup chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito &
```

As an alternative, a startup script has been provided in the root directory `./startup.sh`. Ensure that the script is executable before running or referencing in any automated startup routine.

```sh
chmod +x <username> ./startup.sh
```
