let ingredients = [];
let recipes = [];

async function fetchIngredients() {
  ingredients = await fetch("/api/ingredients").then((r) => r.json());
  const container = document.getElementById("ingredient-checkboxes");
  ingredients.forEach((i) => {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = i.name;
    cb.checked = i.inStock;

    // ZMIENIONY FRAGMENT: Dodajemy zapisywanie do bazy
    cb.addEventListener("change", async (e) => {
      // 1. Zaktualizuj plik JSON na backendzie
      await fetch(`/api/ingredients/${i.name}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inStock: e.target.checked }),
      });

      // 2. Odśwież listę przepisów
      fetchRecipes();
    });

    const label = document.createElement("label");
    label.textContent = i.name;
    label.prepend(cb);
    container.appendChild(label);
  });
}

async function fetchRecipes() {
  const selected = [
    ...document.querySelectorAll("#ingredient-checkboxes input:checked"),
  ].map((i) => i.value);
  recipes = await fetch("/api/recipes?ingredients=" + selected.join(",")).then(
    (r) => r.json(),
  );
  displayRecipes();
}

function displayRecipes() {
  const container = document.getElementById("recipe-list");
  container.innerHTML = "";
  recipes.forEach((r) => {
    const div = document.createElement("div");
    div.classList.add("recipe-card");

    // Ustawianie koloru statusu
    if (r.missingRequired && r.missingRequired.length > 0) {
      div.style.borderLeft = "5px solid red";
    } else if (r.missingOptional && r.missingOptional.length > 0) {
      div.style.borderLeft = "5px solid orange";
    } else {
      div.style.borderLeft = "5px solid green";
    }

    const title = document.createElement("a");
    title.href = r.url || "#";
    title.textContent = r.name;
    div.appendChild(title);

    const have = document.createElement("div");
    have.textContent = "Masz: " + (r.have || []).join(", ");
    have.style.color = "green";
    div.appendChild(have);

    if (r.missingRequired && r.missingRequired.length > 0) {
      const missingReq = document.createElement("div");
      missingReq.textContent =
        "Brakuje wymaganych: " + r.missingRequired.join(", ");
      missingReq.style.color = "red";
      div.appendChild(missingReq);
    }

    if (r.missingOptional && r.missingOptional.length > 0) {
      const missingOpt = document.createElement("div");
      missingOpt.textContent =
        "Brakuje opcjonalnych: " + r.missingOptional.join(", ");
      missingOpt.style.color = "orange";
      div.appendChild(missingOpt);
    }

    container.appendChild(div);
  });
}

async function copyAvailableIngredients() {
  const response = await fetch("/api/ingredients/available");
  const ingredients = await response.json();

  // Łączy nazwę składników przecinkami (gotowe do wklejenia)
  const textToCopy = ingredients.join(", ");

  await navigator.clipboard.writeText(textToCopy);
  alert("Skopiowano składniki: " + textToCopy);
}

fetchIngredients().then(fetchRecipes);
