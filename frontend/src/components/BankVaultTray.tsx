import React from "react";
import type { Player } from "../types";

interface BankVaultTrayProps {
  me: Player | undefined;
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
  onDropOnBankVault?: (cardId: string) => void;
}

export const BankVaultTray: React.FC<BankVaultTrayProps> = ({
  me,
  iOweMoney,
  onPayDebt,
  onDropOnBankVault,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Critical: Permits card elements to be dropped here
  };

  return (
    <div
      className="flex flex-col items-start gap-1 max-w-45"
      onDragOver={handleDragOver}
      onDrop={(e) => {
        const cardId =
          e.dataTransfer.getData("text/plain") ||
          e.dataTransfer.getData("cardId");
        if (cardId && onDropOnBankVault) onDropOnBankVault(cardId);
      }}
    >
      <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1">
        🏦 Bank Vault
      </span>
      <div className="flex gap-1 overflow-x-auto max-w-40 pb-1">
        {me?.bank.map((card, idx) => (
          <button
            key={idx}
            disabled={!iOweMoney}
            onClick={() => onPayDebt(card.id, "bank")}
            className={`shrink-0 px-2 py-1 border rounded-lg font-mono font-black text-[9px] ${
              iOweMoney
                ? "bg-red-900 border-red-400 text-white animate-pulse"
                : "bg-slate-900 border-slate-800 text-emerald-400"
            }`}
          >
            {card.value}M
          </button>
        ))}
      </div>
    </div>
  );
};
