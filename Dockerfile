FROM node:14

EXPOSE 8080
CMD [ "yarn", "start" ]

WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .
