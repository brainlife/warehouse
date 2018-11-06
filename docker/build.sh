
set -e
set -x

#docker pull node:8

tag=1.1.40

docker build -t soichih/warehouse ..
docker tag soichih/warehouse soichih/warehouse:$tag
docker push soichih/warehouse:$tag
