let oldRecipes = [];

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

	static reduce(grid) {
		let newGrid = [];
		for (let i = 0; i < grid.length; i++) {
			let row = grid[i];
			let newRow = [];
			for (let j = 0; j < row.length; j++) {
				let cell = row[j];
				if (cell.c > 0) {
					newRow.push(cell);
				}
			}
			newGrid.push(newRow);
		}
		console.log(newGrid);
		return newGrid;
	}
}

function initRecipes() {
	// Recipes


	// Old oldRecipes
	oldRecipes.push(new Recipe("block", 4, world.blockId["planks"], [world.blockId["wood"], undefined, undefined, undefined]));
	oldRecipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, world.blockId["wood"], undefined, undefined]));
	oldRecipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, undefined, world.blockId["wood"], undefined]));
	oldRecipes.push(new Recipe("block", 4, world.blockId["planks"], [undefined, undefined, undefined, world.blockId["wood"]]));
	oldRecipes.push(new Recipe("block", 1, world.blockId["crafting_table"], [world.blockId["planks"], world.blockId["planks"], world.blockId["planks"], world.blockId["planks"]]));
	oldRecipes.push(new Recipe("item", 4, world.itemId["stick"], [world.blockId["planks"], undefined, world.blockId["planks"], undefined]));
	oldRecipes.push(new Recipe("item", 4, world.itemId["stick"], [undefined, world.blockId["planks"], undefined, world.blockId["planks"]]));

	oldRecipes.push(new Recipe("item", 1, world.itemId["wood_sword"], [world.blockId["planks"], undefined, world.itemId["stick"], undefined]));
	oldRecipes.push(new Recipe("item", 1, world.itemId["wood_sword"], [undefined, world.blockId["planks"], undefined, world.itemId["stick"]]));
}