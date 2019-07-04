FROM node:10.16.0
RUN mkdir -p /usr/src/nodedrop
WORKDIR /usr/src/nodedrop
COPY package.json /usr/src/nodedrop/
RUN npm install
COPY . /usr/src/nodedrop
EXPOSE 3000
CMD [ "npm", "start" ]