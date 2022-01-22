# webpacker container
FROM node:16-alpine AS webpack-builder
WORKDIR /webpack
COPY ./client/tsconfig.json ./
COPY ./client/webpack.config.js ./
COPY ./client/package.json ./
COPY ./client/package-lock.json ./
RUN npm install
COPY ./client/public ./public
COPY ./client/assets ./assets
COPY ./client/src ./src
RUN npm run build

# production container
FROM node:16-alpine AS node
# Install app dependencies
COPY ./server/package.json ./
COPY ./server/package-lock.json ./
RUN npm ci --only=production

WORKDIR /usr/src/app

ENV TEXTURES_PATH="/textures"
COPY ./client/assets/textures/blocks /textures/blocks
COPY ./client/assets/textures/entity /textures/entity
COPY ./client/assets/textures/items /textures/items

COPY --from=webpack-builder /webpack/dist ./dist

COPY ./server/worker.js .
COPY ./server/app.js .
COPY ./server/modules ./modules

# set port for server
ENV PORT=3000
# expose port
EXPOSE 3000

CMD [ "node", "app.js" ]
