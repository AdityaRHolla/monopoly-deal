import React from "react";
import type { Card } from "../types";

interface TargetingBannerProps {
  activeStealCardId: string | null;
  forcedDealMyOfferId: string | null;
  handCards: Card[];
  onCancel: () => void;
}

export const TargetingBanner: React.FC<TargetingBannerProps> = ({
  activeStealCardId,
  forcedDealMyOfferId,
  handCards,
  onCancel,
}) => {
  if (!activeStealCardId) return null;

  const activeCardName =
    handCards.find((c) => c.id === activeStealCardId)?.name || "Theft Action";

  return (
    <div className="w-full max-w-5xl mx-auto my-1 p-2 bg-blue-950/90 border border-blue-500 rounded-xl flex items-center justify-between text-[10px] font-bold text-blue-200 z-40 shadow-xl">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
        <p>
          {!forcedDealMyOfferId && activeCardName === "Forced Deal"
            ? "👉 STEP 1: Click one of YOUR loose properties below to trade away..."
            : "👉 STEP 2: Click an opponent's loose property on the table to steal it!"}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded uppercase font-black tracking-wider text-[8px] text-slate-400 cursor-pointer hover:border-slate-700 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};
