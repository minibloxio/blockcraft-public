// Garbage collection
const gc = require('expose-gc/function');
const WorldGeneration = require('./WorldGeneration');

// Decode RLE encoded array
function RLEdecode(array) {
    var newArray = [], isRip, isRun, ripCount, runCount;
    for (var i = 0; i < array.length; i++) {
        isRip = array[i] < 0;
        isRun = array[i] > 0;
        if (isRip) {
            ripCount = Math.abs(array[i]);
            i += 1;

            newArray = newArray.concat(array.slice(i, i + ripCount));
            i += ripCount - 1;
        }
        if (isRun) {
            runCount = array[i];
            i += 1;
            for (var j = 0; j < runCount; j++) {
                newArray.push(array[i])
            };

        }

    };
    return newArray;
}

// Encode array into RLE
function RLEencode(array) {
    var newArray = [];
    var rip = [];
    var lastValue = undefined;
    var runCount = 0;

    for (var i = 1, lastValue = array[0]; i <= array.length; i++) {
        if (array[i] !== lastValue) {
            if (runCount !== 0) {
                newArray.push(runCount + 1, lastValue);
            } else {
                rip.push(lastValue);
            }
            runCount = 0;
        }

        if (array[i] === lastValue || i === array.length) {
            if (rip.length !== 0) {
                if (rip.length) {
                    newArray.push(-rip.length);
                    newArray = newArray.concat(rip);
                }
                rip = [];
            }
            runCount++;
        }
        lastValue = array[i];
    };
    return newArray;
}

module.exports = class World {
    constructor() {
        // World seed
        this.seed = Math.random();
        this.generator = new WorldGeneration(this.seed);

        this.tick = 0;

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
    loadSaveFile(data, worker, logger) {
        let t = Date.now();
        logger.info("Loading world...")

        data = JSON.parse(data);
        this.tick = data.tick;

        // Load seed
        this.loadSeed(data.seed, worker);

        // Load deltas
        this.cells = {};
        for (let cellId in data.deltas) {
            this.cellDeltas[cellId] = RLEdecode(data.deltas[cellId])
        }

        // Load entities
        this.entities = data.entities || {};

        logger.info("World successfully loaded in " + (Date.now() - t) + "ms");
    }

    // Save world to file
    saveToFile(fs, io, filepath, logger) {
        logger.info("Saving world to: " + filepath);
        let t = Date.now();

        let deltas = {}
        for (let cellId in this.cellDeltas) {
            deltas[cellId] = RLEencode(this.cellDeltas[cellId])
            if (deltas[cellId].length == 2 && deltas[cellId][0] == Math.pow(this.cellSize, 3) && deltas[cellId][1] == 0) delete deltas[cellId];
        }

        let saveObject = {
            seed: this.seed,
            tick: this.tick,
            deltas: deltas,
            entities: this.entities,
        }

        let data = JSON.stringify(saveObject);

        fs.writeFile(filepath, data, function (err) {
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
    computeCellFromPlayer(x, y, z) {
        const { cellSize } = this;
        const cellX = Math.floor(x / cellSize / blockSize);
        const cellY = Math.floor(y / cellSize / blockSize);
        const cellZ = Math.floor(z / cellSize / blockSize);
        return {
            x: cellX,
            y: cellY,
            z: cellZ,
            id: `${cellX},${cellY},${cellZ}`
        }
    }
    getCellPosFromId(id) {
        let pos = id.split(",")
        return {
            x: parseInt(pos[0]),
            y: parseInt(pos[1]),
            z: parseInt(pos[2])
        }
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
        if (cellDelta)
            return this.cellDeltas[this.computeCellId(x, y, z)];
        else
            return this.cells[this.computeCellId(x, y, z)];
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
    encodeCell(cellX, cellY, cellZ) { // RLE Encoding
        let array = this.getCellForVoxel(cellX * this.cellSize, cellY * this.cellSize, cellZ * this.cellSize)

        var newArray = [];
        var rip = [];
        var lastValue = undefined;
        var runCount = 0;
        if (!array) return [];

        for (var i = 1, lastValue = array[0]; i <= array.length; i++) {
            if (array[i] !== lastValue) {
                if (runCount !== 0) {
                    newArray.push(runCount + 1, lastValue);
                } else {
                    rip.push(lastValue);
                }
                runCount = 0;
            }

            if (array[i] === lastValue || i === array.length) {
                if (rip.length !== 0) {
                    if (rip.length) {
                        newArray.push(-rip.length);
                        newArray = newArray.concat(rip);
                    }
                    rip = [];
                }
                runCount++;
            }
            lastValue = array[i];
        };
        return newArray;
    }

    update(dt, players, io) {
        // Update entities
        for (let entity_id in this.entities) {
            let entity = this.entities[entity_id];
            if (entity.type == "item" || entity.type == "arrow") {
                // Delete entity if too long
                let timeLimit = 1000 * 60 * 10; // 10 minutes
                if (entity.name == "fireball") timeLimit = 1000 * 15; // 15 seconds

                if (Date.now() - entity.t > timeLimit) {
                    // Remove the item from world
                    this.newEntities.push({
                        type: "remove_item",
                        id: entity.id,
                        v: entity.v,
                        class: entity.class,
                    })
                    delete this.entities[entity_id];
                }

                // Check collision
                this.checkCollision(entity, players, io);

                // Gravitate towards players
                let deletedEntities = this.gravitateEntities(players, entity, entity_id, io);
                for (let deletedEntity of deletedEntities) {
                    this.newEntities.push(deletedEntity);
                }

                // Apply physics
                this.applyPhysics(entity, dt);
            }
        }
    }

    destroyBlocks(x, y, z, radius) {
        let radiusSquared = radius * radius;
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
    }

    checkCollision(entity, players, io) {
        const { blockSize } = this;

        if (!entity.pos) return;

        // Entity gravity
        var x = Math.floor(entity.pos.x / blockSize);
        var y = Math.floor((entity.pos.y - 4) / blockSize);
        var delta_y = Math.floor((entity.pos.y - 6) / blockSize);
        var z = Math.floor(entity.pos.z / blockSize);

        entity.acc = { x: 0, y: -9.81 * blockSize, z: 0 };

        let deltaVoxel = this.getVoxel(x, delta_y, z); // Check if there is a voxel below the entity
        let voxel = this.getVoxel(x, y, z); // Get the voxel below the entity

        let throwables = ["ender_pearl", "fireball", "snowball", "egg", "arrow"];

        // Check if entity is on ground
        if (throwables.includes(entity.name)) {
            if (entity.name == "ender_pearl" && deltaVoxel > 1) { // ENDER PEARL
                entity.pos.y += blockSize * 1.6;
                players[entity.playerId].hp -= 2.5;
                io.to(`${entity.playerId}`).emit('teleport', entity)
            } else if (entity.name == "fireball" && deltaVoxel > 1) { // FIREBALL
                if (players[entity.playerId].operator) {
                    let explosionRadius = 4;
                    this.destroyBlocks(x, y, z, explosionRadius);
                }
            }

            if (deltaVoxel > 1) { // Check if there is a voxel below the entity
                this.removeItem(entity.id, entity.v, entity.class);
                return;
            }
        } else {
            if (deltaVoxel) {
                entity.acc = { x: 0, y: 0, z: 0 }
                entity.vel = { x: 0, y: 0, z: 0 }
            }
            if (voxel && !throwables.includes(entity.name)) {
                entity.acc = { x: 0, y: 9.81 * blockSize, z: 0 }
                entity.vel = { x: 0, y: 0, z: 0 }
                entity.onObject = true;
            }
        }
    }


    gravitateEntities(players, entity, entity_id, io) {
        if (!entity.pos) return [];

        const { blockSize } = this;
        let entitiesToRemove = []; // Entities to be removed

        for (let id in players) {
            let p = players[id];
            if (p.showInventory || p.pickupDelay > Date.now()) continue;

            // Pick up item
            let dir = { x: (p.pos.x - entity.pos.x), y: (p.pos.y - blockSize - (entity.pos.y)), z: (p.pos.z - entity.pos.z) }
            let dist = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2) + Math.pow(dir.z, 2))

            // Add to player if within a block distance
            if (dist < blockSize) {
                if (entity.v == this.itemId["arrow"] && entity.class == "item" && entity.lethal && !entity.onObject && !players[id].blocking) { // Arrow hit

                    players[id].hp -= entity.force;
                    if (players[entity.playerId]) players[id].dmgType = players[entity.playerId].name;
                    entity.force *= 300
                    entity.dir = entity.vel;
                    io.to(`${id}`).emit('knockback', entity)
                    io.emit('punch', id);

                    // Remove the item from world
                    entitiesToRemove.push({
                        type: "remove_item",
                        id: entity.id,
                        v: entity.v,
                        class: entity.class
                    })
                    delete this.entities[entity_id];
                } else {
                    // Add item to player's inventory if item already exists in inventory
                    World.addItem(p, entity);

                    // Remove the item from world
                    entitiesToRemove.push({
                        type: "remove_item",
                        id: entity.id,
                        v: entity.v,
                        class: entity.class
                    })
                    delete this.entities[entity_id];
                }
            }

            if (dist < blockSize * 2.5 && (entity.v != this.itemId["arrow"] || entity.onObject)) { // Pull when 2 blocks away

                entity.acc.x = dir.x * 2 * blockSize;
                entity.acc.y = dir.y * 2 * blockSize;
                entity.acc.z = dir.z * 2 * blockSize;
            }
        }

        return entitiesToRemove;
    }

    applyPhysics(entity, dt) {
        if (!entity.pos) return;

        // Update velocity and acceleration
        if (entity.name != "fireball") {
            entity.vel.x += entity.acc.x * dt;
            entity.vel.y += entity.acc.y * dt;
            entity.vel.z += entity.acc.z * dt;
        }

        entity.pos.x += entity.vel.x * dt;
        entity.pos.y += entity.vel.y * dt;
        entity.pos.z += entity.vel.z * dt;
    }

    static addItem(p, entity) {
        let added = false;
        // Add item to player's inventory if item already exists in inventory
        for (let slot of p.toolbar) {
            if (!slot) continue;
            if (slot.v == entity.v && slot.class == entity.class) {
                slot.c += entity.amount || 1;
                added = true;
                return;
            }
        }

        // Add item if item does not exist in inventory
        if (!added) {
            let filled = false;
            for (let i = 0; i < p.toolbar.length; i++) {
                if (!p.toolbar[i] || p.toolbar[i].c == 0) {
                    p.toolbar[i] = {
                        v: entity.v,
                        c: entity.amount || 1,
                        class: entity.class
                    }
                    filled = true;
                    break;
                }
            }

            if (!filled) {
                p.toolbar.push({
                    v: entity.v,
                    c: entity.amount || 1,
                    class: entity.class
                })
            }
        }
    }

    removeItem(id, v, c) {
        this.newEntities.push({
            type: "remove_item",
            id: id,
            v: v,
            class: c
        })
        delete this.entities[id];
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