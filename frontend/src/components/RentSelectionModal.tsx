import React from "react";

interface RentSelectionModalProps {
  activeRentCardId: string | null;
  me: any;
  gameState: any;
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

  // FIXED: Explicitly locate the chosen card inside player's hand to read its attributes directly
  const activeCard = me?.hand.find((c: any) => c.id === activeRentCardId);
  if (!activeCard) return null;

  const isWildRent = activeCard.isWildRent === true;
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
    : activeCard.colors || []; // FIXED: Restricting to native dual-color array mapping strings

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-red-900 border-2 border-amber-500 p-5 shadow-2xl text-center">
        <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider animate-pulse">
          💰 Select Rent Color
        </h3>
        <p className="text-[11px] text-amber-100/80 mt-1 font-medium">
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
                className={`py-2.5 px-3 border rounded-xl text-[10px] font-black uppercase text-left transition-all truncate flex items-center justify-between ${
                  ownsColor
                    ? "bg-red-950 border-amber-500/20 hover:border-amber-400 text-amber-300 cursor-pointer active:scale-95 shadow-md"
                    : "bg-red-950/20 border-red-950 text-red-800 opacity-30 cursor-not-allowed"
                }`}
              >
                <span>{color}</span>
                {ownsColor && (
                  <span className="text-[8px] bg-amber-400 text-red-950 px-1 rounded font-bold shadow-sm">
                    Own
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setActiveRentCardId(null)}
          className="w-full mt-4 py-2 border border-dashed border-amber-500/30 hover:border-amber-500/50 text-[10px] font-black uppercase text-amber-400/70 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
