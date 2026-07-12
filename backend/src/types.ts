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
  colorsAvailable: string[]; // Standard has 2 colors. The Multi-color has ["darkblue", "green", "yellow", "red", "orange", "pink", "lightblue", "brown", "railroad", "utility"]
  currentColor: string; // Whichever color the player chooses to map it to right now
  isCompleteWild?: boolean; // True for the 0M value complete wild card
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
  activePayment?: PaymentState; // Add this line here
  doubleRentActive?: boolean;
  activeCounterStack?: CounterStackState;
}
