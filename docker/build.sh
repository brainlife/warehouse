tag=1.0.3
docker build -t soichih/warehouse ..
if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi
docker tag soichih/warehouse soichih/warehouse:$tag
docker push soichih/warehouse:$tag
