docker rm -f warehouse-dev
docker run --restart unless-stopped \
    --name warehouse-dev \
    --net host \
    -v `pwd`:/app \
    -w /app \
    -d node:10 npm run dev
