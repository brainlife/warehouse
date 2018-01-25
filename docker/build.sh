docker build -t soichih/warehouse ..
if [ ! $? -eq 0 ]; then
    echo "failed to build"
    exit
fi
docker tag soichih/warehouse soichih/warehouse:1.0.2
docker push soichih/warehouse
