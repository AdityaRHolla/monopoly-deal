import type { Card } from "./types.js";

// Helper function to generate a complete 110-card deck
export function createDeck(): Card[] {
  const deck: Card[] = [];

  // ==========================================
  // 1. CURRENCY CARDS (20 total)
  // ==========================================
  const moneySpecs = [
    { value: 10, count: 2 },
    { value: 5, count: 3 },
    { value: 4, count: 3 },
    { value: 3, count: 3 },
    { value: 2, count: 5 },
    { value: 1, count: 6 },
  ];

  moneySpecs.forEach((spec) => {
    for (let i = 0; i < spec.count; i++) {
      deck.push({
        id: `money-${spec.value}m-${i}`,
        name: `${spec.value}M Banknote`,
        type: "money",
        value: spec.value,
      });
    }
  });

  // ==========================================
  // 2. PROPERTY CARDS (28 total single properties)
  // ==========================================
  const propertySpecs = [
    { color: "darkblue", name: "Boardwalk", value: 4, count: 1 },
    { color: "darkblue", name: "Park Place", value: 4, count: 1 },
    {
      color: "green",
      names: ["North Carolina Ave", "Pacific Ave", "Pennsylvania Ave"],
      value: 4,
    },
    {
      color: "yellow",
      names: ["Marvin Gardens", "Atlantic Ave", "Ventnor Ave"],
      value: 3,
    },
    {
      color: "red",
      names: ["Illinois Ave", "Indiana Ave", "Kentucky Ave"],
      value: 3,
    },
    {
      color: "orange",
      names: ["New York Ave", "St. James Place", "Tennessee Ave"],
      value: 2,
    },
    {
      color: "pink",
      names: ["St. Charles Place", "States Ave", "Virginia Ave"],
      value: 2,
    },
    {
      color: "lightblue",
      names: ["Connecticut Ave", "Oriental Ave", "Vermont Ave"],
      value: 1,
    },
    { color: "brown", names: ["Baltic Ave", "Mediterranean Ave"], value: 1 },
    {
      color: "railroad",
      names: [
        "Reading Railroad",
        "Pennsylvania Railroad",
        "B. & O. Railroad",
        "Short Line",
      ],
      value: 2,
    },
    { color: "utility", names: ["Water Works", "Electric Company"], value: 2 },
  ];

  propertySpecs.forEach((spec) => {
    if ("names" in spec && spec.names) {
      spec.names.forEach((name, i) => {
        deck.push({
          id: `prop-${spec.color}-${i}`,
          name,
          type: "property",
          color: spec.color,
          value: spec.value,
        });
      });
    } else if ("name" in spec && spec.name) {
      deck.push({
        id: `prop-${spec.color}-${spec.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: spec.name,
        type: "property",
        color: spec.color,
        value: spec.value,
      });
    }
  });

  // ==========================================
  // 3. PROPERTY WILDCARDS (11 total)
  // ==========================================
  // 9 Dual-color wildcards
  const dualWildcards = [
    { colors: ["darkblue", "green"], value: 4, count: 1 },
    { colors: ["lightblue", "brown"], value: 1, count: 1 },
    { colors: ["lightblue", "railroad"], value: 4, count: 1 },
    { colors: ["pink", "orange"], value: 2, count: 2 },
    { colors: ["yellow", "red"], value: 3, count: 2 },
    { colors: ["utility", "railroad"], value: 2, count: 1 },
    { colors: ["green", "railroad"], value: 4, count: 1 },
  ];

  dualWildcards.forEach((spec, index) => {
    for (let i = 0; i < spec.count; i++) {
      deck.push({
        id: `wild-${spec.colors.join("-")}-${index}-${i}`,
        name: `${spec.colors[0].toUpperCase()} / ${spec.colors[1].toUpperCase()} Wildcard`,
        type: "wildcard",
        colorsAvailable: spec.colors,
        currentColor: spec.colors[0],
        value: spec.value,
      });
    }
  });

  // 2 Multi-color absolute wildcards
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `wild-multicolor-${i}`,
      name: "Multi-Color Property Wildcard",
      type: "wildcard",
      colorsAvailable: [
        "darkblue",
        "green",
        "yellow",
        "red",
        "orange",
        "pink",
        "lightblue",
        "brown",
        "railroad",
        "utility",
      ],
      currentColor: "", // Player must assign a color when played
      value: 0,
    });
  }

  // ==========================================
  // 4. ACTION CARDS (34 total)
  // ==========================================
  const actionSpecs = [
    { actionType: "deal_breaker", name: "Deal Breaker", value: 5, count: 2 },
    { actionType: "just_say_no", name: "Just Say No", value: 4, count: 3 },
    { actionType: "sly_deal", name: "Sly Deal", value: 3, count: 3 },
    { actionType: "forced_deal", name: "Forced Deal", value: 3, count: 3 },
    {
      actionType: "debt_collector",
      name: "Debt Collector",
      value: 3,
      count: 3,
    },
    { actionType: "birthday", name: "It's My Birthday", value: 2, count: 3 },
    { actionType: "pass_go", name: "Pass Go", value: 1, count: 10 },
    { actionType: "house", name: "House", value: 3, count: 3 },
    { actionType: "hotel", name: "Hotel", value: 4, count: 2 },
  ] as const;

  actionSpecs.forEach((spec) => {
    for (let i = 0; i < spec.count; i++) {
      deck.push({
        id: `action-${spec.actionType}-${i}`,
        name: spec.name,
        type: "action",
        actionType: spec.actionType,
        value: spec.value,
      });
    }
  });

  // ==========================================
  // 5. RENT CARDS (13 total)
  // ==========================================
  const standardRentSpecs = [
    { colors: ["darkblue", "green"], count: 2 },
    { colors: ["lightblue", "brown"], count: 2 },
    { colors: ["pink", "orange"], count: 2 },
    { colors: ["utility", "railroad"], count: 2 },
  ];

  standardRentSpecs.forEach((spec, index) => {
    for (let i = 0; i < spec.count; i++) {
      deck.push({
        id: `rent-${spec.colors.join("-")}-${index}-${i}`,
        name: `${spec.colors[0].toUpperCase()} & ${spec.colors[1].toUpperCase()} Rent`,
        type: "rent",
        colorsAvailable: spec.colors,
        isWildRent: false,
        value: 1,
      });
    }
  });

  // 3 Multi-color Wild Rent Cards
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: `rent-wild-${i}`,
      name: "Wild Rent Card",
      type: "rent",
      colorsAvailable: [
        "darkblue",
        "green",
        "yellow",
        "red",
        "orange",
        "pink",
        "lightblue",
        "brown",
        "railroad",
        "utility",
      ],
      isWildRent: true,
      value: 3,
    });
  }

  return deck;
}

// Pure Fisher-Yates Shuffling algorithm
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
