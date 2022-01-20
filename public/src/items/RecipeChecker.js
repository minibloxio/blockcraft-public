import world from "../managers/WorldManager.js";

export default class Recipe {
  static getEntityName(entity) {
    if (entity && entity.class == "item") {
      return world.itemOrder[entity.v - 1];
    } else if (entity && entity.class == "block") {
      return world.blockOrder[entity.v - 1];
    }
  }

  // Check recipe at position
  static checkRecipe(recipe, grid, rows, columns, i, j, size, mirrored) {
    let same = true;
    let recipeSize = 0;

    // Loop through recipe grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        let colIndex = mirrored ? columns - c - 1 : c;
        let recipeItem = recipe.grid[r][colIndex];
        if (recipeItem) recipeSize++;
        let entity = grid[j + c + (i + r) * (size - 1)];

        let craftingItem = Recipe.getEntityName(entity);
        if (craftingItem != recipeItem) {
          same = false;
          break;
        }
      }
      if (!same) {
        break;
      }
    }
    return { same, recipeSize };
  }

  // Check shapeless recipe
  static checkShapelessRecipe(recipe, grid) {
    let recipeSize = recipe.grid.length;

    for (let i = 0; i < recipe.grid.length; i++) {
      let item = recipe.grid[i];
      for (let j = 0; j < grid.length; j++) {
        let entity = grid[j];

        let craftingItem = Recipe.getEntityName(entity);
        if (craftingItem == item) {
          recipeSize--;
          break;
        }
      }
    }

    if (recipeSize == 0) {
      return { same: true, recipeSize: recipe.grid.length };
    } else {
      return { same: false, recipeSize: recipe.grid.length };
    }
  }
}
