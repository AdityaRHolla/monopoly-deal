import React from "react";
import { Landmark, Coins } from "lucide-react";
import type { Card } from "../types";

interface PlayerVaultProps {
  bankCards: Card[];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
}

export const PlayerVault: React.FC<PlayerVaultProps> = ({
  bankCards,
  iOweMoney,
  onPayDebt,
}) => {
  const bankTotal = bankCards.reduce((sum, card) => sum + card.value, 0);

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col backdrop-blur-sm">
      {/* Structural Header Title Block */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900/60">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400">
          <Landmark size={14} />
          <span>Your Bank Vault</span>
        </div>
        <div className="font-mono font-black text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2.5 py-0.5 rounded-lg shadow-inner flex items-center gap-1">
          <Coins size={12} />
          <span>{bankTotal}M</span>
        </div>
      </div>

      {/* Fan-Out Dynamic Interlocking Layout Cash Area */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-slate-800 min-h-17">
        {bankCards.map((card, idx) => (
          <button
            key={`${card.id}-${idx}`}
            disabled={!iOweMoney}
            onClick={() => onPayDebt(card.id, "bank")}
            className={`shrink-0 px-3 py-2 border rounded-xl font-mono font-black text-xs transition-all duration-200 flex items-center gap-1.5 active:scale-95 shadow-md ${
              iOweMoney
                ? "bg-red-950/40 border-red-500/60 text-red-400 hover:bg-red-600 hover:border-red-400 hover:text-white cursor-pointer animate-pulse"
                : "bg-emerald-950/60 border-emerald-800/40 text-emerald-400"
            }`}
          >
            <span>{card.value}M</span>
            {iOweMoney && (
              <span className="text-[8px] font-black uppercase bg-black/40 text-red-400 px-1 rounded">
                Pay
              </span>
            )}
          </button>
        ))}

        {bankCards.length === 0 && (
          <span className="text-xs font-medium text-slate-600 m-auto italic tracking-wide">
            Vault contains no asset capital
          </span>
        )}
      </div>
    </div>
  );
};
