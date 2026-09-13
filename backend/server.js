import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  ensureSchema,
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  getRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
} from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// --- Ingredients endpoints ---
app.get("/api/ingredients", async (req, res) => {
  res.json(await getIngredients());
});

app.post("/api/ingredients", async (req, res) => {
  await addIngredient(req.body);
  res.json({ success: true });
});

// GET /api/ingredients/available - pobiera tylko składniki z inStock === true
app.get("/api/ingredients/available", async (req, res) => {
  const ingredients = await getIngredients();

  // Zwraca tylko nazwy w postaci tablicy stringów: ["mąka", "cukier"]
  const availableNames = ingredients
    .filter((ing) => ing.inStock === true)
    .map((ing) => ing.name);

  res.json(availableNames);
});

app.put("/api/ingredients/:name", async (req, res) => {
  const updated = await updateIngredient(req.params.name, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

app.delete("/api/ingredients/:name", async (req, res) => {
  await deleteIngredient(req.params.name);
  res.json({ success: true });
});

// --- Recipes endpoints ---
app.get("/api/recipes", async (req, res) => {
  let recipes = await getRecipes();

  const selectedIngredients = req.query.ingredients
    ? req.query.ingredients.split(",")
    : [];
  const selectedTags = req.query.tags ? req.query.tags.split(",") : [];

  // Filter by tags
  if (selectedTags.length > 0) {
    recipes = recipes.filter((r) =>
      r.tags?.some((tag) => selectedTags.includes(tag)),
    );
  }

  // Rank by selected ingredients
  if (selectedIngredients.length > 0) {
    recipes = recipes.map((r) => {
      const have = [];
      const missingRequired = [];
      const missingOptional = [];

      let requiredCount = 0;
      let haveRequiredCount = 0;

      r.ingredients.forEach((ing) => {
        const allNames = [ing.name, ...(ing.substitute || [])];
        const isHave = allNames.some((n) => selectedIngredients.includes(n));

        if (isHave) {
          have.push(ing.name);
          if (!ing.optional) haveRequiredCount++;
        } else {
          if (ing.optional) {
            missingOptional.push(ing.name);
          } else {
            missingRequired.push(ing.name);
          }
        }

        if (!ing.optional) requiredCount++;
      });

      // Chronimy przed dzieleniem przez zero, gdyby przepis miał same opcjonalne składniki
      const score = requiredCount > 0 ? haveRequiredCount / requiredCount : 1;

      return { ...r, have, missingRequired, missingOptional, score };
    });
    recipes.sort((a, b) => b.score - a.score);
  }
  res.json(recipes);
});

app.post("/api/recipes", async (req, res) => {
  await addRecipe(req.body);
  res.json({ success: true });
});

app.put("/api/recipes/:name", async (req, res) => {
  const updated = await updateRecipe(req.params.name, req.body);
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

app.delete("/api/recipes/:name", async (req, res) => {
  await deleteRecipe(req.params.name);
  res.json({ success: true });
});

const port = process.env.PORT || 3000;
ensureSchema().then(() => {
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
});
