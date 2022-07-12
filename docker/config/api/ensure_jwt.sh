#!/bin/bash

if [ ! -f /apps/warehouse/api/config/warehouse.jwt ]; then
    docker-compose exec auth /apps/auth/bin/auth.js \
        issue \
        --scopes '{ "auth": ["admin"], "amaretti": ["admin"], "profile": ["admin"] }' \
        --sub 'warehouse' \
        --out /apps/warehouse/api/config/warehouse.jwt
fi