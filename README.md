# BlockCraft

BlockCraft is a WebGL implementation of an infinite procedurally-generated voxel world that runs on the browser. This project originally spawned as a Minecraft Classic clone but has expanded to include multiplayer PvP, crafting, shaders and much more!

Here's a [summary](https://victorwei.com/blog/blockcraft.pdf) of my development journey

## [Play it online now](https://blockcraft.online)

## Getting started

### Running a local client

1. Clone the repo
2. Go into the client folder
3. Install the node modules
4. Run npm start.

The client files will be available on http://localhost:3001 by default.

```
git clone https://github.com/blockcraftio/blockcraft.git
cd blockcraft/client
npm install
npm start
```

### Running a local server

1. Clone the repo
2. Go into the server folder
3. Install the node modules
4. Set up the .env file
5. Run npm start.

The local server will be available for direct connect on http://localhost:3001 when you have the local client running as it proxies the connections. It is also available at http://localhost:3002

```
git clone https://github.com/blockcraftio/blockcraft.git
cd blockcraft/server
npm install
cp .env.example .env
npm start
```
