// Garbage collection
const gc = require('expose-gc/function');
const WorldGeneration = require('./WorldGeneration');
const THREE = require('three');
const RLE = require('./RLE');

module.exports = class World {
    constructor() {
        // World seed
        this.seed = Math.random();
        this.generator = new WorldGeneration(this.seed);

        this.tick = 0;
        this.canUpdate = true;

        // Cell management
        this.blockSize = 16;
        this.cellSize = 16;
        this.buildHeight = this.cellSize * 8;
        const { cellSize } = this;
        this.cellSliceSize = cellSize * cellSize;
        this.cells = {};
        this.cellDeltas = {};

        // Entities
        this.entities = {};
        this.newEntities = [];

        this.updatedBlocks = [];
    }

    // Initiate textures
    init(options) {
        // Server io
        this.io = options.io;

        // Block ids
        this.blockOrder = options.blockOrder || [];
        this.blockId = {};
        for (let i = 0; i < this.blockOrder.length; i++) {
            this.blockId[this.blockOrder[i]] = i + 1;
        }

        // Item ids
        this.itemOrder = options.itemOrder || [];
        this.itemId = {};

        for (let i = 0; i < this.itemOrder.length; i++) {
            this.itemId[this.itemOrder[i]] = i + 1;
        }
    }

    // Load seed
    loadSeed(seed, worker) {
        this.seed = seed;
        this.generator.setSeed(seed);
        worker.postMessage({ cmd: "seed", seed: seed });
    }

    // Load save file
    loadSaveFile(data, worker, logger, server) {
        let t = Date.now();
        logger.info("Loading world...")

        data = JSON.parse(data);
        this.tick = data.tick;

        // Load seed
        this.loadSeed(data.seed, worker);

        // Load deltas
        this.cells = {};
        for (let cellId in data.deltas) {
            this.cellDeltas[cellId] = RLE.decode(data.deltas[cellId])
        }

        // Load entities
        this.entities = {};
        for (let id in data.entities) {
            let entity = data.entities[id];
            this.entities[id] = server.addEntity(id, entity);
        }

        logger.info("World successfully loaded in " + (Date.now() - t) + "ms");
    }

    // Save world to file
    saveToFile(fs, io, filepath, logger) {
        logger.info("Saving world to: " + filepath);
        let t = Date.now();

        let deltas = {}
        for (let cellId in this.cellDeltas) {
            deltas[cellId] = RLE.encode(this.cellDeltas[cellId])
            if (deltas[cellId].length == 2 && deltas[cellId][0] == Math.pow(this.cellSize, 3) && deltas[cellId][1] == 0) delete deltas[cellId];
        }

        let saveObject = {
            seed: this.seed,
            tick: this.tick,
            deltas: deltas,
            entities: this.entities,
        }

        let data = JSON.stringify(saveObject);

        fs.writeFile(filepath, data, function(err) {
            if (err) throw err;
            let txt = "Server successfully saved in " + (Date.now() - t) + " ms";
            io.emit('messageAll', {
                text: txt,
                color: "purple",
                discard: true
            })
        });

        this.purge(logger); // Purge memory

        let msg = "Successfully saved world in " + (Date.now() - t) + "ms";
        logger.info(msg);
    }

    // Purge world
    purge(logger) {
        //this.cells = {};
        let t = Date.now();
        let prevMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        gc();
        let newMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        logger.info("World purged in " + (Date.now() - t) + "ms. Memory saved: " + Math.floor((prevMemory - newMemory) * 100) / 100 + "MB");
    }

    // Euclidean Modulo
    static euclideanModulo(a, b) { return (a % b + b) % b }
    computeVoxelOffset(x, y, z) {
        const { cellSize, cellSliceSize } = this;
        const voxelX = World.euclideanModulo(x, cellSize) | 0;
        const voxelY = World.euclideanModulo(y, cellSize) | 0;
        const voxelZ = World.euclideanModulo(z, cellSize) | 0;
        return voxelY * cellSliceSize +
            voxelZ * cellSize +
            voxelX;
    }
    computeCellId(x, y, z) {
        const { cellSize } = this;
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const cellZ = Math.floor(z / cellSize);
        return `${cellX},${cellY},${cellZ}`;
    }
    addCellForVoxel(x, y, z) {
        const { cellSize } = this;

        const cellId = this.computeCellId(x, y, z);
        let cell = this.cells[cellId];
        let cellDelta = this.cellDeltas[cellId];

        if (!cell) {
            cell = new Uint8Array(new SharedArrayBuffer(cellSize * cellSize * cellSize));
            this.cells[cellId] = cell;
        }

        if (!cellDelta) {
            this.cellDeltas[cellId] = new Uint8Array(new SharedArrayBuffer(cellSize * cellSize * cellSize));
        }
        return cell;
    }
    getCellForVoxel(x, y, z, cellDelta) {
        if (cellDelta) return this.cellDeltas[this.computeCellId(x, y, z)];
        else return this.cells[this.computeCellId(x, y, z)];
    }
    setVoxel(x, y, z, v, changeDelta, addCell = true) {
        let cell = this.getCellForVoxel(x, y, z);
        if (!cell) {
            if (!addCell) {
                return;
            }
            cell = this.addCellForVoxel(x, y, z);
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        cell[voxelOffset] = v;

        if (changeDelta) {
            let cellDelta = this.getCellForVoxel(x, y, z, true);
            cellDelta[voxelOffset] = v + 1;
        }
    }
    getVoxel(x, y, z, cellDelta) {
        const cell = this.getCellForVoxel(x, y, z, cellDelta);
        if (!cell) {
            return 0;
        }
        const voxelOffset = this.computeVoxelOffset(x, y, z);
        return cell[voxelOffset];
    }
    encodeCell(cellX, cellY, cellZ) {
        let array = this.getCellForVoxel(cellX * this.cellSize, cellY * this.cellSize, cellZ * this.cellSize);

        return RLE.encode(array);
    }

    explode(x, y, z, radius, players = {}, io) {
        let radiusSquared = radius * radius;

        // Destroy blocks within radius
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    let x_ = x + dx;
                    let y_ = y + dy;
                    let z_ = z + dz;
                    let voxel = this.getVoxel(x_, y_, z_);
                    if (voxel <= 1) continue;
                    let distSquared = dx * dx + dy * dy + dz * dz;
                    if (distSquared <= radiusSquared) {
                        this.setVoxel(x_, y_, z_, 0, true);
                        this.updatedBlocks.push({ x: x_, y: y_, z: z_, t: 0 });
                    }
                }
            }
        }
        // Destroy entities within radius
        for (let id in this.entities) {
            let entity = this.entities[id];
            let pos = entity.pos.clone().divideScalar(this.blockSize);
            let distSquared = pos.distanceToSquared(new THREE.Vector3(x, y, z));
            if (distSquared <= radiusSquared) {
                this.removeItem(entity);
            }
        }
        // Damage players within radius
        for (let id in players) {
            let player = players[id];
            if (player.mode != "survival") continue;
            let pos = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z).divideScalar(this.blockSize);
            let distSquared = pos.distanceToSquared(new THREE.Vector3(x, y, z));
            if (distSquared <= radiusSquared) {
                let damage = Math.floor((radiusSquared - distSquared) / radiusSquared * 15);

                player.hp -= damage;
                player.dmgType = "explosion";
                io.to(id).emit("knockback", {
                    dir: pos.sub(new THREE.Vector3(x, y, z)).normalize(),
                    force: damage * 100,
                    explosion: true,
                });
            }
        }
    }

    getDist(player, entity) {
        const { blockSize } = this;
        let dir = new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z).sub(entity.pos);
        dir.y -= blockSize * 0.6;
        let dist = dir.length();
        return { dist, dir }
    }

    checkItemDespawn(entity) {
        let timeLimit = 1000 * 60 * 5; // 5 minutes
        if (entity.name == "fireball") timeLimit = 1000 * 15; // 15 seconds
        if (Date.now() - entity.t > timeLimit) this.removeItem(entity);
    }

    checkCollision(entity, players, io) {
        const { blockSize } = this;
        if (!entity.pos) return;

        // Entity gravity
        let x = Math.floor(entity.pos.x / blockSize);
        let y = Math.floor((entity.pos.y - 4) / blockSize);
        let delta_y = Math.floor((entity.pos.y - 6) / blockSize);
        let z = Math.floor(entity.pos.z / blockSize);

        if (!entity.onObject) entity.acc = new THREE.Vector3(0, -9.81 * blockSize, 0);

        let deltaVoxel = this.getVoxel(x, delta_y, z); // Check if there is a voxel below the entity
        let voxel = this.getVoxel(x, y, z); // Get the voxel below the entity

        let throwables = ["ender_pearl", "fireball", "snowball", "egg"];

        // Check if entity is on ground
        if (throwables.includes(entity.name)) {
            if (entity.name == "ender_pearl" && deltaVoxel > 1) { // ENDER PEARL
                entity.pos.y += blockSize * 1.6;
                if (players[entity.playerId].mode == "survival") {
                    players[entity.playerId].hp -= 5;
                    players[entity.playerId].dmgType = "ender_pearl";
                }
                io.to(`${entity.playerId}`).emit('teleport', entity)
            } else if (entity.name == "fireball" && deltaVoxel > 1) { // FIREBALL
                if (players[entity.playerId].operator) { // Check if player is operator
                    let explosionRadius = 4;
                    this.explode(x, y, z, explosionRadius, players, io);
                }
            }

            if (deltaVoxel > 1) {
                this.removeItem(entity);
                return true;
            }
        } else if (entity.name != "arrow") { // Check if there is a voxel below the entity
            if (deltaVoxel) {
                entity.acc = new THREE.Vector3();
                entity.vel = new THREE.Vector3();
                entity.onGround = true;
            }
            if (voxel) {
                entity.acc = new THREE.Vector3(0, 9.81, 0);
                entity.vel = new THREE.Vector3();
                entity.onObject = true;
            }
        }
    }

    gravitateEntity(players, entity) {
        if (!entity.pos) return [];
        if (entity.name == "arrow" && !entity.onObject) return;

        const { blockSize } = this;

        for (let id in players) {
            let player = players[id];
            if (player.showInventory || player.pickupDelay > Date.now() || (player.mode == "spectator" || player.mode == "camera")) continue;

            // Pick up item
            let { dist, dir } = this.getDist(player, entity);

            // Add to player if within a block distance
            if (dist < blockSize) {
                World.addItem(player, entity);
                this.removeItem(entity);
                return;
            }

            // Pull when 2 blocks away
            if (dist < blockSize * 2) {
                entity.acc.set(dir.x, dir.y, dir.z);
                let pullStrength = 3;
                if (entity.name == "arrow") pullStrength = 16;
                entity.acc.multiplyScalar(16 * blockSize);
                entity.pulling = true;
            }
        }
    }

    checkArrowCollision(players, entity, io) {
        const { blockSize } = this;
        if (!entity.pos || entity.name != "arrow" || entity.pulling) return;


        let pos = entity.pos.clone();
        let vel = entity.vel.clone()

        vel.normalize().multiplyScalar(7);
        pos.add(vel).divideScalar(blockSize);

        if (entity.lastPos) pos = entity.lastPos;

        let voxel = this.getVoxel(pos.x, pos.y, pos.z);

        // Check collision with world
        if (voxel > 1) {
            entity.acc = new THREE.Vector3();
            entity.vel = new THREE.Vector3();
            entity.lastPos = pos.clone();
            entity.onObject = true;
        } else {
            entity.lastPos = null;
        }

        // Check collision with players
        for (let id in players) {
            let player = players[id];
            let canHitOwnPlayer = (Date.now() - entity.t > 200) ? true : id != entity.playerId;
            if (player.mode == "spectator" || player.mode == "camera" || player.blocking || player.dead || entity.onObject || !canHitOwnPlayer) continue;

            let { dist } = this.getDist(player, entity);
            if (dist > blockSize) continue;

            // Arrow hit
            let damage = entity.force * 2 - 1;
            if (Date.now() - player.immune > 500) { // Check if player is immune
                player.hp -= damage;
                player.immune = Date.now();

                if (players[entity.playerId]) player.dmgType = "arrow" + players[entity.playerId].name;
                entity.force *= 300;
                entity.dir = entity.vel; // Update direction of arrow based on velocity
                io.to(`${id}`).emit('knockback', entity);
                io.emit('punch', id); // Update player color
            }

            // Remove the item from world
            this.removeItem(entity);

            return true;
        }
    }

    applyPhysics(entity, dt, players, io) {
        if (!entity.pos) return;

        entity.onObject = false;
        entity.pulling = false;

        // Check collision with world
        let hit = this.checkArrowCollision(players, entity, io);
        if (hit) return;

        // Gravitate towards players
        this.gravitateEntity(players, entity);

        // Update velocity and acceleration
        if (entity.name != "fireball") {
            let da = entity.acc.clone().multiplyScalar(dt);
            entity.vel.add(da);
        }

        // Apply physics iteratively
        let iterations = 8;
        for (let i = 0; i < iterations; i++) {
            let dv = entity.vel.clone().multiplyScalar(dt / iterations);
            entity.pos.add(dv);

            let collided = this.checkCollision(entity, players, io);
            if (collided) return;

            if (!entity.pulling) {
                let hit = this.checkArrowCollision(players, entity, io);
                if (hit) return;
            }
        }
    }

    update(dt, players, io) {
        // Update entities
        for (let id in this.entities) {
            let entity = this.entities[id];
            if (entity.type != "item") continue;

            // Get cell position of entity
            // let cellBlockSize = this.blockSize * this.cellSize;
            // let x = Math.floor(entity.pos.x / cellBlockSize);
            // let y = Math.floor(entity.pos.y / cellBlockSize);
            // let z = Math.floor(entity.pos.z / cellBlockSize);
            // let cellId = `${x},${y},${z}`;
            // if (!this.cells[cellId]) continue;

            // Delete entity if too long
            this.checkItemDespawn(entity);

            // Apply physics
            if (this.canUpdate) this.applyPhysics(entity, dt, players, io);
        }
    }

    static addItem(p, entity) {
        // Add item to player's inventory if item already exists in inventory
        for (let slot of p.toolbar) {
            if (!slot || slot.v != entity.v || slot.class != entity.class) continue;

            slot.c += entity.amount || 1;
            return;
        }

        let newItem = {
            v: entity.v,
            c: entity.amount || 1,
            class: entity.class
        }

        for (let i = 0; i < p.toolbar.length; i++) {
            if (p.toolbar[i] && p.toolbar[i].c != 0) continue;

            p.toolbar[i] = newItem;
            return;
        }

        // Add item if item does not exist in inventory
        if (p.toolbar.length < 36) {
            p.toolbar.push(newItem);
        }
    }

    removeItem(entity) {
        this.newEntities.push({
            type: "remove_item",
            id: entity.id,
            v: entity.v,
            class: entity.c
        })
        delete this.entities[entity.id];
    }

    removePlayerItem(player, name) {
        if (player.mode == "creative") return;
        let voxel = this.itemId[name] || this.blockId[name];

        for (let t of player.toolbar) {
            if (t && t.v == voxel && t.c > 0) {
                t.c = Math.max(0, t.c - 1);
                break;
            }
        }
    }
}