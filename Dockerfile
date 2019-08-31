FROM node:10

MAINTAINER Soichi Hayashi <hayashis@iu.edu>

RUN apt-get update && apt install -y vim

#RUN npm install http-server -g
#    npm install pm2 -g && \
#    pm2 install pm2-slack && \
#    pm2 set pm2-slack:error false && \
#    pm2 set pm2-slack:exit true && \
#    pm2 install pm2-logrotate && \
#    pm2 set pm2-logrotate:retain 7

COPY . /app
RUN cd /app && npm install --production 

EXPOSE 8080

#CMD [ "/app/docker/start.sh" ]

