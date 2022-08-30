FROM node:16

COPY . /ui
WORKDIR /ui

RUN npm install

CMD [ "node", "build/dev-server.js" ]
