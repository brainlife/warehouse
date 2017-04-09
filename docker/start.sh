#!/bin/bash

#This script is used inside the docker container to start api and ui(via http-server)

pm2 start /app/api/warehouse.js
#pm2 start http-server --name ui -- -p 80 -a 0.0.0.0 -d false /app/ui/dist

pm2 logs
