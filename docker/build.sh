#!/bin/bash
set -e
set -x

tag=1.1.46

docker build -t soichih/warehouse ..
docker tag soichih/warehouse soichih/warehouse:$tag
docker push soichih/warehouse:$tag
