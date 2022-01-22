# webpacker container
FROM node:16-alpine AS webpack-builder
WORKDIR /webpack
COPY tsconfig.json ./
COPY webpack.config.js ./
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY ./public ./public
RUN npm run webpack:build

# production container
FROM node:16-alpine AS node
# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --only=production

WORKDIR /usr/src/app
COPY ./public/assets/textures/blocks ./public/textures/blocks
COPY ./public/assets/textures/entity ./public/textures/entity
COPY ./public/assets/textures/items ./public/textures/items

COPY --from=webpack-builder /webpack/dist ./dist

COPY ./worker.js .
COPY ./app.js .
COPY ./modules ./modules

# set port for server
ENV PORT=3000
# expose port
EXPOSE 3000

CMD [ "node", "app.js" ]
