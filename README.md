# Stock Tracker &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/kajgrant/stocktracker/blob/master/LICENSE) [![Node.js CI](https://github.com/kajgrant/stocktracker/actions/workflows/node.js.yml/badge.svg)](https://github.com/kajgrant/stocktracker/actions/workflows/node.js.yml) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

A minimal tracker for Stocks and Cryptocurrencies. Intended for use on external Raspberry Pi based displays, or within a browser.

## Developed With

- [Node 18.18.0](https://nodejs.org/en)
- [Vue](https://vuejs.org/)
- [Vite](https://vitejs.dev/)

## Prerequisites

Please ensure the following software is installed on your system:

- [Node 18.x](https://nodejs.org/en/download)

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Docker Deployment

To deploy within Docker, please follow these steps

### Prerequisites

1. Install [Docker Engine](https://docs.docker.com/engine/install/)
2. Build the dockerfile

```
docker build -t <tag_name>/stocktracker .
```

3. Run the dockerfile

```
docker run -d -p 8080:80 --name stock-tracker-1 <tag_name>/stocktracker
```

## Deployment on Raspberry Pi

Ensure the Docker deployment steps from above are followed on the target Raspberry Pi

1. Install chromium browser version 88

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
chromium-browser --app=http://localhost:8080/ --start-fullscreen --incognito
```
