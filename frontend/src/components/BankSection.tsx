import React from "react";
import { Coins, Landmark } from "lucide-react";
import type { Card } from "../types";

interface BankSectionProps {
  bankCards: Card[];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
}

export const BankSection: React.FC<BankSectionProps> = ({
  bankCards,
  iOweMoney,
  onPayDebt,
}) => {
  // Safe calculation utility to tally up bank asset value metrics
  const bankTotal = bankCards.reduce((sum, card) => sum + card.value, 0);

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-900 rounded-2xl shadow-xl flex flex-col h-full">
      {/* Structural Heading metadata label banner */}
      <div className="flex items-center gap-2 text-xs font-black text-emerald-400 mb-3 uppercase tracking-wider">
        <Landmark size={14} />
        <span>Bank Vault ({bankTotal}M total)</span>
      </div>

      {/* Grid containing discrete currency assets layout panels */}
      <div className="flex flex-wrap gap-2 content-start flex-1 min-h-15 bg-slate-950/40 p-3 rounded-xl border border-slate-900/40">
        {bankCards.map((card, idx) => (
          <button
            key={`${card.id}-${idx}`}
            disabled={!iOweMoney}
            onClick={() => onPayDebt(card.id, "bank")}
            className={`px-3 py-1.5 border rounded-lg text-xs font-black text-emerald-300 transition-all duration-200 flex items-center gap-1 ${
              iOweMoney
                ? "bg-red-950/40 border-red-500/60 hover:bg-red-600 hover:border-red-400 hover:text-white hover:scale-105 shadow-md shadow-red-950/40 cursor-pointer"
                : "bg-emerald-950/80 border-emerald-800/60"
            }`}
          >
            <Coins size={12} className="text-emerald-500" />
            <span>{card.value}M</span>
            {iOweMoney && (
              <span className="text-[8px] font-black uppercase bg-black/40 text-red-400 px-1 rounded ml-1 animate-pulse">
                Pay
              </span>
            )}
          </button>
        ))}

        {bankCards.length === 0 && (
          <span className="text-xs font-medium text-slate-600 m-auto italic">
            Vault is empty
          </span>
        )}
      </div>
    </div>
  );
};
