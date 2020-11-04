let recipes = [];

class Recipe {
	constructor(type, outputQuantity, output, input) {
		this.output = {
			class: type,
			c: outputQuantity,
			v: output
		};
		this.grid = input;
	}

	check(grid) {
		return JSON.stringify(this.grid)==JSON.stringify(grid);
	}
}

function initRecipes() {
	recipes.push(new Recipe("block", 4, world.blockId["planks"], [world.blockId["wood"], undefined, undefined, undefined]));
	recipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, world.blockId["wood"], undefined, undefined]));
	recipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, undefined, world.blockId["wood"], undefined]));
	recipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, undefined, undefined, world.blockId["wood"]]));
	recipes.push(new Recipe("block", 1, world.blockId["crafting_table"], [world.blockId["planks"], world.blockId["planks"], world.blockId["planks"], world.blockId["planks"]]));
	recipes.push(new Recipe("item", 4, world.itemId["stick"], [world.blockId["planks"], undefined, world.blockId["planks"], undefined]));
	recipes.push(new Recipe("item", 4, world.itemId["stick"], [undefined, world.blockId["planks"], undefined, world.blockId["planks"]]));

	recipes.push(new Recipe("item", 1, world.itemId["wood_sword"], [world.blockId["planks"], undefined, world.itemId["stick"], undefined]));
	recipes.push(new Recipe("item", 1, world.itemId["wood_sword"], [undefined, world.blockId["planks"], undefined, world.itemId["stick"]]));
}