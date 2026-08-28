// Which restaurants each delivery partner is allowed to pick up from.
// Modeled as a simple id -> id[] map since the source schema doesn't
// define a dedicated join table for it; a real backend would likely
// expose this as its own endpoint (e.g. GET/PUT /delivery-guys/:id/restaurants).
export const deliveryGuyRestaurantAssignments: Record<number, number[]> = {
  1: [1, 2],
  2: [3],
  3: [4, 5],
  4: [5],
  5: [1, 3, 6],
}
