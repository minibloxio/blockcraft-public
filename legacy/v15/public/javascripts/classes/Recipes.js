let recipes = [];

class Recipe {
	constructor(num, output, input) {
		this.output = {
			c: num,
			v: output
		};
		this.grid = input;
	}

	check(grid) {
		return JSON.stringify(this.grid)==JSON.stringify(grid);
	}
}

recipes.push(new Recipe(4, 13, [6, undefined, undefined, undefined]));
recipes.push(new Recipe(4, 13, [undefined, 6, undefined, undefined]));
recipes.push(new Recipe(4, 13, [undefined, undefined, 6, undefined]));
recipes.push(new Recipe(4, 13, [undefined, undefined, undefined, 6]));