import React from "react";
import { GameCardView } from "./GameCardView";
import type { Card } from "../types";

interface PlayerHandDrawerProps {
  hand: Card[];
  isMyTurn: boolean;
  actionsLeft: number;
  hasPaymentState: boolean;
  onEndTurn: () => void;
  onPlayPassGo: (cardId: string) => void;
  onPlayProperty: (cardId: string) => void;
  onBankMoney: (cardId: string) => void;
  onPlayTargetedAction: (cardId: string, actionType: string) => void;
  onSetStealCard: (cardId: string) => void;
}

export const PlayerHandDrawer: React.FC<PlayerHandDrawerProps> = ({
  hand,
  isMyTurn,
  actionsLeft,
  hasPaymentState,
  onEndTurn,
  onPlayPassGo,
  onPlayProperty,
  onBankMoney,
  onPlayTargetedAction,
  onSetStealCard,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between shadow-2xl z-20 mt-auto">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-2">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
          Your Hand Tray ({hand.length} / 7)
        </span>
        {isMyTurn && !hasPaymentState && (
          <button
            onClick={onEndTurn}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase rounded-full shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <span>End Turn</span>
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pt-6 pb-4 px-2 items-end justify-start sm:justify-center scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {hand.map((card) => {
          const isPassGo =
            card.type === "action" && (card as any).actionType === "pass_go";
          const isTargetedAction =
            card.type === "action" &&
            ["debt_collector", "birthday"].includes((card as any).actionType);
          const isSlyDeal =
            card.type === "action" && (card as any).actionType === "sly_deal";
          const isForcedDeal =
            card.type === "action" &&
            (card as any).actionType === "forced_deal";
          const isProperty =
            card.type === "property" || card.type === "wildcard";

          let actionFn: (() => void) | undefined = undefined;
          let label = "";

          if (isMyTurn && actionsLeft > 0 && !hasPaymentState) {
            if (isPassGo) {
              actionFn = () => onPlayPassGo(card.id);
              label = "Pass Go";
            } else if (isSlyDeal || isForcedDeal) {
              actionFn = () => onSetStealCard(card.id);
              label = isSlyDeal ? "Sly" : "Forced";
            } else if (isTargetedAction) {
              actionFn = () =>
                onPlayTargetedAction(card.id, (card as any).actionType);
              label = (card as any).actionType === "birthday" ? "BDay" : "5M";
            } else if (isProperty) {
              actionFn = () => onPlayProperty(card.id);
              label = "Lay";
            } else if (card.value > 0) {
              actionFn = () => onBankMoney(card.id);
              label = "Bank";
            }
          }

          return (
            <GameCardView
              key={card.id}
              card={card}
              onAction={actionFn}
              actionLabel={label}
              disabled={!isMyTurn || actionsLeft <= 0 || hasPaymentState}
            />
          );
        })}
      </div>
    </div>
  );
};
