export type CardType = "money" | "property" | "wildcard" | "action" | "rent";

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  value: number; // Face value in Millions
}

export interface PropertyCard extends BaseCard {
  type: "property";
  color: string;
}

export interface WildcardCard extends BaseCard {
  type: "wildcard";
  colorsAvailable: string[];
  currentColor: string;
}

export interface ActionCard extends BaseCard {
  type: "action";
  actionType:
    | "deal_breaker"
    | "just_say_no"
    | "sly_deal"
    | "forced_deal"
    | "debt_collector"
    | "birthday"
    | "pass_go"
    | "house"
    | "hotel";
}

export interface RentCard extends BaseCard {
  type: "rent";
  colorsAvailable: string[];
  isWildRent: boolean; // True if it applies to any single color against one opponent
}

export type Card =
  | PropertyCard
  | WildcardCard
  | ActionCard
  | RentCard
  | BaseCard;

export interface PropertySet {
  cards: Card[];
  isComplete: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  bank: Card[];
  propertySets: { [color: string]: PropertySet };
}

export interface GameRoom {
  roomId: string;
  status: "waiting" | "playing" | "ended";
  hostId: string;
  turn: number; // Index of the current player in the array
  actionsLeft: number; // Track actions: max 3 per turn
  deck: Card[];
  discardPile: Card[];
  players: Player[];
}
