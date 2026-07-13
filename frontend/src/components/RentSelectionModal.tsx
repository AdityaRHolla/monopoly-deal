import React from "react";
import type { Player, GameRoom } from "../types";

interface RentSelectionModalProps {
  activeRentCardId: string | null;
  me: Player | undefined;
  gameState: GameRoom;
  setTargetModalCardId: (id: string | null) => void;
  setActiveRentCardId: (id: string | null) => void;
  socket: any;
}

export const RentSelectionModal: React.FC<RentSelectionModalProps> = ({
  activeRentCardId,
  me,
  gameState,
  setTargetModalCardId,
  setActiveRentCardId,
  socket,
}) => {
  if (!activeRentCardId) return null;

  const activeCard = me?.hand.find((c) => c.id === activeRentCardId);
  const isWildRent = activeCard
    ? (activeCard as any).isWildRent === true
    : false;

  const rentColors = isWildRent
    ? [
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
      ]
    : (activeCard as any).colors || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-center">
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
          💰 Select Rent Color
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Choose which property column to calculate rent values from:
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4 max-h-40 overflow-y-auto p-1">
          {rentColors.map((color: string) => {
            const ownsColor =
              me?.propertySets[color] &&
              me.propertySets[color].cards.length > 0;

            return (
              <button
                key={color}
                disabled={!ownsColor}
                onClick={() => {
                  if (isWildRent) {
                    setTargetModalCardId(activeRentCardId);
                    (window as any)._cachedRentColor = color;
                  } else {
                    socket.emit("play_rent_card", {
                      roomId: gameState.roomId,
                      actionCardId: activeRentCardId,
                      chosenColor: color,
                    });
                  }
                  setActiveRentCardId(null);
                }}
                className={`py-2 px-3 border rounded-xl text-[10px] font-black uppercase text-left transition-all truncate flex items-center justify-between ${
                  ownsColor
                    ? "bg-slate-950 border-slate-800 hover:border-emerald-500 text-slate-200 cursor-pointer active:scale-95"
                    : "bg-slate-950/20 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed"
                }`}
              >
                <span>{color}</span>
                {ownsColor && (
                  <span className="text-[8px] bg-emerald-950 border border-emerald-900/60 text-emerald-400 px-1 rounded">
                    Own
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setActiveRentCardId(null)}
          className="w-full mt-4 py-2 border border-dashed border-slate-800 hover:border-slate-700 text-[10px] font-black uppercase text-slate-400 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
