import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureSchema, addIngredient, addRecipe } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../data");
const ingredients = JSON.parse(
  fs.readFileSync(path.join(dataPath, "ingredients.json")),
);
const recipes = JSON.parse(
  fs.readFileSync(path.join(dataPath, "recipes.json")),
);

await ensureSchema();

for (const ingredient of ingredients) {
  await addIngredient(ingredient);
  console.log(`Seeded ingredient: ${ingredient.name}`);
}

for (const recipe of recipes) {
  await addRecipe(recipe);
  console.log(`Seeded recipe: ${recipe.name}`);
}

console.log(
  `Done. Seeded ${ingredients.length} ingredients and ${recipes.length} recipes.`,
);
