export function updatePantryIfNewDay() {
  const pantryRaw = localStorage.getItem("shelflife_pantry");
  if (!pantryRaw) return [];

  const pantry = JSON.parse(pantryRaw);
  const lastUpdated = localStorage.getItem("lastUpdatedDate");
  const today = new Date().toDateString();

  if (lastUpdated === today) {
    return pantry; // No update needed
  }

  // Update each item
  const updatedPantry = pantry.map((item) => ({
    ...item,
    timeElapsed: item.timeElapsed + 1,
  }));

  // Save back to localStorage
  localStorage.setItem("shelflife_pantry", JSON.stringify(updatedPantry));
  localStorage.setItem("lastUpdatedDate", today);

  return updatedPantry;
}

export function updateShelfIfIntervalPassed(intervalMs = 24 * 60 * 60 * 1000) {
  const shelfRaw = localStorage.getItem("shelflife_shelf");
  if (!shelfRaw) return [];

  const shelf = JSON.parse(shelfRaw);
  const lastUpdated = parseInt(localStorage.getItem("shelfLastUpdated") || "0", 10);
  const now = Date.now();

  if (now - lastUpdated < intervalMs) {
    return shelf; // Not enough time has passed
  }

  const updatedShelf = shelf.map(item => ({
    ...item,
    timeElapsed: item.timeElapsed + 1,
  }));

  localStorage.setItem("shelflife_shelf", JSON.stringify(updatedShelf));
  localStorage.setItem("shelfLastUpdated", now.toString());

  return updatedShelf;
}

export function skipDayOnShelf() {
  const shelfRaw = localStorage.getItem("shelflife_shelf");
  if (!shelfRaw) return [];
  const shelf = JSON.parse(shelfRaw);
  const updatedShelf = shelf.map(item => ({
    ...item,
    timeElapsed: item.timeElapsed + 1,
  }));
  localStorage.setItem("shelflife_shelf", JSON.stringify(updatedShelf));
  // Also update the last updated timestamp to now
  localStorage.setItem("shelfLastUpdated", Date.now().toString());
  return updatedShelf;
}
