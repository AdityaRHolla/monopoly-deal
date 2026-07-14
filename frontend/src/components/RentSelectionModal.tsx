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

  // 🔍 Safely locate the active rent card instance in your hand drawer payload
  const activeCard = me?.hand.find((c: any) => c.id === activeRentCardId);
  if (!activeCard) return null;

  // 🛡️ Safe fallback parser: Check boolean primitive, string flags, or if the name contains "wild"
  const isWildRent =
    activeCard.isWildRent === true ||
    activeCard.isWildRent === "true" ||
    activeCard.name?.toLowerCase().includes("wild");

  // 🎨 STRICT NORMALIZATION MATRIX LOOPS
  let rentColors: string[] = [];

  if (isWildRent) {
    rentColors = [
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
    ];
  } else {
    // Read your backend card's colors array dynamically, fallback to any available attributes case
    const rawColors: string[] =
      activeCard.colors ||
      activeCard.Colors ||
      activeCard.colorsAvailable ||
      [];

    // Convert all extracted entries to strict lowercase to match your propertySets structure keys
    rentColors = rawColors.map((c: string) => String(c).toLowerCase().trim());
  }

  // 🚨 LAST RESORT SAFETY NET: If the array is still empty due to a deck naming mismatch,
  // we scrape the card name (e.g. "Red & Yellow Rent") to salvage the correct color values!
  if (rentColors.length === 0 && activeCard.name) {
    const nameLower = activeCard.name.toLowerCase();
    const standardColors = [
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
    ];
    standardColors.forEach((color) => {
      if (nameLower.includes(color)) {
        rentColors.push(color);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl bg-red-900 border-2 border-amber-500 p-5 shadow-2xl text-center">
        <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider animate-pulse">
          💰 Select Rent Color
        </h3>
        <p className="text-[11px] text-amber-100/80 mt-1 font-medium">
          Choose which property lot column to calculate rent values from:
        </p>

        {/* Dynamic Color Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 max-h-40 overflow-y-auto p-1">
          {rentColors.map((color: string) => {
            // Check if player actually owns cards in this specific property container block
            const ownsColor =
              me?.propertySets?.[color] &&
              me.propertySets[color].cards &&
              me.propertySets[color].cards.length > 0;

            return (
              <button
                key={color}
                disabled={!ownsColor}
                onClick={() => {
                  if (isWildRent) {
                    // Wild Rent triggers the targeted opponent selection screen modal layout flow
                    setTargetModalCardId(activeRentCardId);
                    (window as any)._cachedRentColor = color;
                  } else {
                    // Standard dual-color rent fires directly to your complete backend routine handlers
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

          {/* Fallback warning if data extraction completely drops to zero */}
          {rentColors.length === 0 && (
            <p className="col-span-2 text-[9px] text-amber-300/60 italic p-4">
              No matching color categories found on this card asset payload.
            </p>
          )}
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
