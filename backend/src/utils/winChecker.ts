import type { Player } from "../types.js";

export function checkForWinCondition(player: Player): boolean {
  let completedColorSetsCount = 0;

  // Track base color groups we've already scored to avoid duplicate set clones double-counting
  const countedBaseColors = new Set<string>();

  // Loop through all active property blocks laid down on the player's board
  for (const colorKey of Object.keys(player.propertySets)) {
    const currentSet = player.propertySets[colorKey];

    if (currentSet.isComplete) {
      // Extract the core base color (e.g. extracts "green" out of a cloned duplicate "green_2")
      const baseColor = colorKey.split("_")[0];

      // Verify this base color hasn't been double-counted toward our 3-set goal
      if (!countedBaseColors.has(baseColor)) {
        completedColorSetsCount += 1;
        countedBaseColors.add(baseColor);
      }
    }
  }

  // The Match Win Metric check: Returns true instantly if 3 unique sets are secured
  return completedColorSetsCount >= 3;
}
