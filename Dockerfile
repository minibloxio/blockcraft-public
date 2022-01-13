FROM node:16-alpine
# Create app directory
WORKDIR /usr/src/app

# Set port
ENV PORT=3000

# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --only=production

# default world for now
COPY ./saves/world2.json ./saves/test.json

COPY ./worker.js .
COPY ./app.js .
COPY ./modules ./modules
COPY ./public ./public

EXPOSE 3000
CMD [ "node", "app.js" ]
