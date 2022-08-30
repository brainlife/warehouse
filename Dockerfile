FROM node:16

COPY . /app

WORKDIR /app
RUN npm install -g pm2

RUN npm install

#ENTRYPOINT [ "/app/run.sh" ]
