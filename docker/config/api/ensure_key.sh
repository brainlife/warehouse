#!/bin/bash

if [ ! -f warehouse.key ]; then
    openssl genrsa -out warehouse.key 2048
    chmod 600 warehouse.key
fi
if [ ! -f warehouse.pub ]; then
    openssl rsa -in warehouse.key -pubout > warehouse.pub
fi
