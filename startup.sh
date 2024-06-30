#!/bin/bash
export DISPLAY=:0
xset s off
xset -dpms
xset s noblank

nohup chromium-browser --kiosk --app=http://localhost:8080/ --start-fullscreen --incognito &