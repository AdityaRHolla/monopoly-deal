export type CardType = "money" | "property" | "wildcard" | "action" | "rent";

export interface BaseCard {
  id: string;
  name: string;
  type: "money" | "property" | "action" | "rent" | "wildcard";
  value: number;
}

export interface PropertyCard extends BaseCard {
  type: "property";
  color: string;
}

export interface WildcardCard extends BaseCard {
  type: "wildcard";
  colorsAvailable: string[]; // e.g. ["darkblue", "green"]
  currentColor: string;
  isCompleteWild?: boolean;
}

// Ensure Rent cards track their dual-color mapping keys
export interface RentCard extends BaseCard {
  type: "rent";
  colors: string[]; // e.g. ["red", "yellow"]
  isWildRent: boolean;
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

export interface PaymentState {
  owedTo: string; // Player ID who played the action card
  amountOwed: number; // Total Millions demanded
  pendingPayers: string[]; // List of player IDs who still need to pay
}

export interface CounterStackState {
  originalCard: Card; // The Action/Rent card that was thrown down
  playedBy: string; // Player ID who initiated the move
  targetPlayerId?: string; // Explicit target opponent ID (if applicable)
  payload: any; // Cache event variables (targetCardId, chosenColor, etc.)
  currentVetoPlayerId: string; // The player who currently has the right to counter or pass
}

export interface GameRoom {
  roomId: string;
  status: "waiting" | "playing" | "ended";
  hostId: string;
  turn: number;
  actionsLeft: number;
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  activePayment?: PaymentState;
  doubleRentActive?: boolean;
  activeCounterStack?: CounterStackState;
}
