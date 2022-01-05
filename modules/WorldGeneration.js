let SimplexNoise = require('simplex-noise')

let rng1, rng2;

module.exports = class WorldGeneration {
    constructor (seed) {
        this.heightNoise = 128;

        this.waterLevel = Math.floor(0.1 * this.heightNoise) + 30;
        this.mountainLevel = 80;

        if (seed) this.setSeed(seed);
    }

    setSeed(seed) {
        rng1 = new SimplexNoise(seed);
        rng2 = new SimplexNoise(seed + 0.2 > 1 ? seed - 0.8 : seed + 0.2);
    }

    noise1(nx, ny) { 
        return rng1.noise2D(nx, ny) / 2 + 0.5; 
    }
    noise2(nx, ny) { 
        return rng2.noise2D(nx, ny) / 2 + 0.5; 
    }

    getColumnInfo(xPos, zPos) {
        let size = 256;
        let exponent = 3;

        let {noise1, noise2} = this;

        var nx = xPos / size - 0.5, ny = zPos / size - 0.5;
        var e = (1.00 * noise1(1 * nx, 1 * ny)
            + 0.50 * noise1(2 * nx, 2 * ny)
            + 0.25 * noise1(4 * nx, 4 * ny)
            + 0.13 * noise1(8 * nx, 8 * ny)
            + 0.06 * noise1(16 * nx, 16 * ny)
            + 0.03 * noise1(32 * nx, 32 * ny));
        e /= (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
        e = Math.pow(e, exponent);
        var m = (1.00 * noise2(1 * nx, 1 * ny)
            + 0.75 * noise2(2 * nx, 2 * ny)
            + 0.33 * noise2(4 * nx, 4 * ny)
            + 0.33 * noise2(8 * nx, 8 * ny)
            + 0.33 * noise2(16 * nx, 16 * ny)
            + 0.50 * noise2(32 * nx, 32 * ny));
        m /= (1.00 + 0.75 + 0.33 + 0.33 + 0.33 + 0.50);

        return [e, m, this.biome(e, m)];
    }
    biome(e, m) {
        if (e < 0.1) return "OCEAN";
        if (e < 0.12) return "BEACH";

        if (e > 0.6) {
            if (m < 0.4) return "SCORCHED";
            if (m < 0.6) return "BARE";
            if (m < 0.8) return "TUNDRA";
            return "SNOW";
        }

        if (e > 0.4) {
            if (m < 0.33) return "TEMPERATE_DESERT";
            if (m < 0.66) return "SHRUBLAND";
            return "TAIGA";
        }

        if (e > 0.3) {
            if (m < 0.16) return "TEMPERATE_DESERT";
            if (m < 0.50) return "GRASSLAND";
            if (m < 0.83) return "TEMPERATE_DECIDUOUS_FOREST";
            return "TEMPERATE_RAIN_FOREST";
        }

        if (m < 0.16) return "SUBTROPICAL_DESERT";
        if (m < 0.33) return "GRASSLAND";
        if (m < 0.66) return "TROPICAL_SEASONAL_FOREST";
        return "TROPICAL_RAIN_FOREST";
    }

    getHeight(height) {
        return Math.floor(height * this.heightNoise) + 30;
    }

    generateCell(cellX, cellY, cellZ, world, exists) {
        let caveSparsity = 0.02;
        let coalSparsity = 0.2;
        let ironSparsity = 0.2;
        let goldSparsity = 0.15;
        let diamondSparsity = 0.2;

        const { cellSize } = world;

        for (let z = 0; z < cellSize; ++z) {
            for (let x = 0; x < cellSize; ++x) {
                // Get cell offset
                let xPos = x + cellX * cellSize;
                let zPos = z + cellZ * cellSize;

                let height, moisture, biome;
                [height, moisture, biome] = this.getColumnInfo(xPos, zPos);
                height = this.getHeight(height);

                for (let y = 0; y < cellSize; ++y) {
                    let yPos = y + cellY * cellSize;

                    if (world.getVoxel(xPos, yPos, zPos) > 0) // Block already exists here
                        continue;

                    let blockId = 0;

                    // Waterlands
                    if (biome == "OCEAN" && yPos <= this.waterLevel) {
                        if (yPos >= height) blockId = "water";
                        else if (yPos > height - 3 && moisture < 0.33) blockId = "sand"
                        else if (yPos > height - 3 && moisture < 0.4) blockId = "clay"
                        else if (yPos > height - 3) blockId = "gravel"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "BEACH" && yPos <= height) {
                        if (yPos > height - 1) blockId = "sand";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    // Mountains
                    if (biome == "SCORCHED" && yPos <= height) {
                        if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "BARE" && yPos <= height) {
                        if (yPos >= height) blockId = "dirt";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TUNDRA" && yPos <= height) {
                        if (yPos >= height) blockId = "snowy_grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "SNOW" && yPos <= height) {
                        if (yPos > height - 1) blockId = "snow";
                        else if (yPos > height - 2) blockId = "snowy_grass"
                        else if (yPos > height - 4) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    // Highlands
                    if (biome == "TEMPERATE_DESERT" && yPos <= height) {
                        if (yPos >= height) blockId = "sand";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "SHRUBLAND" && yPos <= height) {
                        if (yPos >= height) blockId = "grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TAIGA" && yPos <= height) {
                        if (yPos >= height) blockId = "snowy_grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    // Midlands
                    if (biome == "GRASSLAND" && yPos <= height) {
                        if (yPos >= height) blockId = "grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TEMPERATE_DECIDUOUS_FOREST" && yPos <= height) {
                        if (yPos >= height) blockId = "grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TEMPERATE_RAIN_FOREST" && yPos <= height) {
                        if (yPos >= height) blockId = "grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    // Lowlands

                    if (biome == "SUBTROPICAL_DESERT" && yPos <= height) {
                        if (yPos >= height) blockId = "sand";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TROPICAL_SEASONAL_FOREST" && yPos <= height) {
                        if (yPos >= height) blockId = "grass";
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    if (biome == "TROPICAL_RAIN_FOREST" && yPos <= height) {
                        if (yPos == height) blockId = "cobblestone"
                        else if (yPos > height - 3) blockId = "dirt"
                        else if (yPos > 0) blockId = "stone"
                    }

                    const coal = rng1.noise3D(xPos * coalSparsity, yPos * coalSparsity, zPos * coalSparsity);
                    const iron = rng1.noise3D(xPos * ironSparsity, yPos * ironSparsity, zPos * ironSparsity);
                    const gold = rng1.noise3D(xPos * goldSparsity, yPos * goldSparsity, zPos * goldSparsity);
                    const diamond = rng1.noise3D(xPos * diamondSparsity, yPos * diamondSparsity, zPos * diamondSparsity);

                    if (yPos <= height - 3 && yPos > 0) {
                        blockId = "stone";
                        // Ore generation

                        blockId = (coal > 0.6 && yPos > 24) ? "coal_ore" : blockId
                        blockId = (iron > 0.7 && yPos > 18) ? "iron_ore" : blockId
                        blockId = (gold > 0.9 && yPos < 18) ? "gold_ore" : blockId
                        blockId = (diamond > 0.9 && yPos < 12) ? "diamond_ore" : blockId
                    }

                    if (yPos == 0) {
                        blockId = "bedrock"; // Force bedrock layer
                    }

                    blockId = world.blockId[blockId];

                    world.setVoxel(xPos, yPos, zPos, blockId);
                }
            }
        }

        // Add fauna
        for (let z = -3; z < cellSize + 3; ++z) {
            for (let x = -3; x < cellSize + 3; ++x) {
                // Get cell offset
                let xPos = x + cellX * cellSize;
                let zPos = z + cellZ * cellSize;
                let height, moisture, biome;
                [height, moisture, biome] = this.getColumnInfo(xPos, zPos);
                height = Math.floor(height * this.heightNoise) + 30

                // Add fauna
                let tree = rng1.noise3D(xPos / 30, height, zPos / 30) * rng1.noise2D(xPos, zPos) > moisture && height > this.waterLevel && height < this.mountainLevel;

                let ungrowable = ["OCEAN", "BEACH", "SCORCHED", "BARE", "SNOW"]
                if (ungrowable.indexOf(biome) > -1) tree = false;

                if ((rng1.noise3D(xPos * 0.05, height * caveSparsity, zPos * 0.05) + 1) / 2 <= 0.1)
                    continue;

                // Add tree
                if (tree) {
                    for (let y = 1; y < 6; y++) {
                        if (Math.floor((height + y)/cellSize) != cellY) continue;
                        world.setVoxel(xPos, height + y, zPos, world.blockId["log_oak"]);
                    }

                    for (let y = 3; y <= 6; y++) {
                        if (y == 3 || y == 4) {
                            for (let x = -2; x <= 2; x++) {
                                for (let z = -2; z <= 2; z++) {
                                    if (Math.floor((height + y)/cellSize) != cellY) continue;
                                    if (!(x == 0 && z == 0))
                                        world.setVoxel(xPos + x, height + y, zPos + z, world.blockId["leaves_oak"]);
                                }
                            }
                        } else if (y == 5) {
                            for (let x = -1; x <= 1; x++) {
                                for (let z = -1; z <= 1; z++) {
                                    if (Math.floor((height + y)/cellSize) != cellY) continue;
                                    if (!(x == 0 && z == 0))
                                        world.setVoxel(xPos + x, height + y, zPos + z, world.blockId["leaves_oak"]);
                                }
                            }
                        } else {
                            for (let x = -1; x <= 1; x++) {
                                if (Math.floor((height + y)/cellSize) != cellY) continue;
                                world.setVoxel(xPos + x, height + y, zPos, world.blockId["leaves_oak"]);
                            }
                            for (let z = -1; z <= 1; z++) {
                                if (Math.floor((height + y)/cellSize) != cellY) continue;
                                world.setVoxel(xPos, height + y, zPos + z, world.blockId["leaves_oak"]);
                            }
                        }
                    }
                }
            }
        }

        // Adjust to cell deltas
        for (let z = 0; z < cellSize; ++z) {
            for (let x = 0; x < cellSize; ++x) {
                for (let y = 0; y < cellSize; ++y) {
                    // Get cell offset
                    let xPos = x + cellX * cellSize;
                    let yPos = y + cellY * cellSize;
                    let zPos = z + cellZ * cellSize;

                    let v = world.getVoxel(xPos, yPos, zPos, true)-1;
                    if (v >= 0) world.setVoxel(xPos, yPos, zPos, v, false, true);
                }
            }
        }
    }
}