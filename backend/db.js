import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function ensureSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ingredients (
      name TEXT PRIMARY KEY,
      inStock INTEGER NOT NULL DEFAULT 0,
      expiryDate TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS recipes (
      name TEXT PRIMARY KEY,
      url TEXT,
      comment TEXT,
      tags TEXT,
      ingredients TEXT NOT NULL
    )
  `);
}

const ingredientRowToObject = (row) => {
  const ingredient = { name: row.name, inStock: !!row.inStock };
  if (row.expiryDate) ingredient.expiryDate = row.expiryDate;
  return ingredient;
};

const recipeRowToObject = (row) => {
  const recipe = {
    name: row.name,
    ingredients: JSON.parse(row.ingredients),
  };
  if (row.url) recipe.url = row.url;
  if (row.comment) recipe.comment = row.comment;
  if (row.tags) recipe.tags = JSON.parse(row.tags);
  return recipe;
};

export async function getIngredients() {
  const result = await client.execute("SELECT * FROM ingredients");
  return result.rows.map(ingredientRowToObject);
}

export async function addIngredient(ingredient) {
  await client.execute({
    sql: "INSERT OR REPLACE INTO ingredients (name, inStock, expiryDate) VALUES (?, ?, ?)",
    args: [
      ingredient.name,
      ingredient.inStock ? 1 : 0,
      ingredient.expiryDate ?? null,
    ],
  });
}

export async function updateIngredient(name, patch) {
  const result = await client.execute({
    sql: "SELECT * FROM ingredients WHERE name = ?",
    args: [name],
  });
  if (result.rows.length === 0) return null;

  const merged = { ...ingredientRowToObject(result.rows[0]), ...patch };
  await client.execute({
    sql: "UPDATE ingredients SET inStock = ?, expiryDate = ? WHERE name = ?",
    args: [merged.inStock ? 1 : 0, merged.expiryDate ?? null, name],
  });
  return merged;
}

export async function deleteIngredient(name) {
  await client.execute({
    sql: "DELETE FROM ingredients WHERE name = ?",
    args: [name],
  });
}

export async function getRecipes() {
  const result = await client.execute("SELECT * FROM recipes");
  return result.rows.map(recipeRowToObject);
}

export async function addRecipe(recipe) {
  await client.execute({
    sql: "INSERT OR REPLACE INTO recipes (name, url, comment, tags, ingredients) VALUES (?, ?, ?, ?, ?)",
    args: [
      recipe.name,
      recipe.url ?? null,
      recipe.comment ?? null,
      recipe.tags ? JSON.stringify(recipe.tags) : null,
      JSON.stringify(recipe.ingredients ?? []),
    ],
  });
}

export async function updateRecipe(name, patch) {
  const result = await client.execute({
    sql: "SELECT * FROM recipes WHERE name = ?",
    args: [name],
  });
  if (result.rows.length === 0) return null;

  const merged = { ...recipeRowToObject(result.rows[0]), ...patch };
  await client.execute({
    sql: "UPDATE recipes SET url = ?, comment = ?, tags = ?, ingredients = ? WHERE name = ?",
    args: [
      merged.url ?? null,
      merged.comment ?? null,
      merged.tags ? JSON.stringify(merged.tags) : null,
      JSON.stringify(merged.ingredients ?? []),
      name,
    ],
  });
  return merged;
}

export async function deleteRecipe(name) {
  await client.execute({
    sql: "DELETE FROM recipes WHERE name = ?",
    args: [name],
  });
}
