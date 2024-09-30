#!/bin/bash
export DISPLAY=:0

nohup chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito &