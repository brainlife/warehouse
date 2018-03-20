#!/bin/bash

#This script is used inside the docker container to start api and ui(via http-server)

pm2 start /app/api/warehouse.js
pm2 start /app/bin/rule_handler.js
pm2 start /app/bin/event_handler.js

pm2 logs
