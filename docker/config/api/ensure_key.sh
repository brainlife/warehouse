#!/bin/bash

if [ ! -f /apps/warehouse/api/config/warehouse.key ]; then
    openssl genrsa -out /apps/warehouse/api/config/warehouse.key 2048
    chmod 600 /apps/warehouse/api/config/warehouse.key
fi
if [ ! -f /apps/warehouse/api/config/warehouse.pub ]; then
    openssl rsa -in /apps/warehouse/api/config/warehouse.key -pubout > /apps/warehouse/api/config/warehouse.pub
fi
