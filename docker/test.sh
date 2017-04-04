
docker run \
    --name sca-wf1 \
    --net test \
    -v `pwd`/config:/app/config \
    --rm -it soichih/sca-wf
