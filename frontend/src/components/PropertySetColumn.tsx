import React, { useState } from "react";
import { Shuffle } from "lucide-react";
import { GameCardView } from "./GameCardView";
import { PokerChips } from "./PokerChips";
import type { PropertySet } from "../types";

interface PropertySetColumnProps {
  color: string;
  set: PropertySet;
  isMyTurn: boolean;
  iOweMoney: boolean;
  activeBuildingCardId: string | null | undefined;
  buildingType: "house" | "hotel" | null | undefined;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
  onReorganizeWildcard?: (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => void;
  onBuildModifier?: (targetColor: string) => void;
  onDropOnPropertySet?: (cardId: string, targetColor?: string) => void;
}

export const PropertySetColumn: React.FC<PropertySetColumnProps> = ({
  color,
  set,
  isMyTurn,
  iOweMoney,
  activeBuildingCardId,
  buildingType,
  onPayDebt,
  onReorganizeWildcard,
  onBuildModifier,
  onDropOnPropertySet,
}) => {
  const [activeWildcardId, setActiveWildcardId] = useState<string | null>(null);

  const allGameColors = [
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

  const hasHouse = set.cards.some(
    (c: any) => c.type === "action" && c.actionType === "house",
  );
  const hasHotel = set.cards.some(
    (c: any) => c.type === "action" && c.actionType === "hotel",
  );

  const isEligible =
    set.isComplete &&
    color !== "railroad" &&
    color !== "utility" &&
    !!activeBuildingCardId;

  let showBuildOverlay = false;
  if (isEligible && buildingType === "house" && !hasHouse)
    showBuildOverlay = true;
  if (isEligible && buildingType === "hotel" && hasHouse && !hasHotel)
    showBuildOverlay = true;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="flex flex-col gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 max-w-21.25 relative group"
      onDragOver={handleDragOver}
      onDrop={(e) => {
        e.stopPropagation();
        const cardId =
          e.dataTransfer.getData("text/plain") ||
          e.dataTransfer.getData("cardId");
        if (cardId && onDropOnPropertySet) onDropOnPropertySet(cardId, color);
      }}
    >
      {showBuildOverlay && onBuildModifier && (
        <button
          onClick={() => onBuildModifier(color)}
          className="absolute inset-0 z-30 bg-amber-500/90 border border-amber-400 rounded-lg flex flex-col items-center justify-center text-slate-950 font-black text-[8px] uppercase tracking-wider shadow-2xl animate-pulse cursor-pointer"
        >
          <span>🏗️ Build</span>
          <span className="text-[6px] font-mono opacity-80 mt-0.5">
            {buildingType}
          </span>
        </button>
      )}

      <PokerChips cardCount={set.cards.length} color={color} />

      <div className="flex flex-col gap-0.5 max-h-20 overflow-visible">
        {set.cards.map((c, idx) => (
          <div
            key={idx}
            className="scale-75 origin-top -my-3 first:mt-0 last:mb-0 relative group"
          >
            <GameCardView card={c} isCompact={true} />

            {isMyTurn && c.type === "wildcard" && onReorganizeWildcard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveWildcardId(activeWildcardId === c.id ? null : c.id);
                }}
                className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900 border border-slate-700 text-blue-400 rounded z-20 cursor-pointer scale-75"
              >
                <Shuffle size={8} />
              </button>
            )}

            {activeWildcardId === c.id && (
              <div className="absolute inset-x-0.5 top-4 bg-slate-950 border border-blue-900 rounded p-0.5 z-30 flex flex-col gap-0.5 max-h-12.5 overflow-y-auto">
                {allGameColors
                  .filter((t) => t !== color)
                  .map((targetColor) => (
                    <button
                      key={targetColor}
                      onClick={() => {
                        onReorganizeWildcard?.(c.id, color, targetColor);
                        setActiveWildcardId(null);
                      }}
                      className="w-full text-[6px] py-0.5 px-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-left truncate hover:bg-blue-600 hover:text-white uppercase font-black"
                    >
                      ➡️ {targetColor}
                    </button>
                  ))}
              </div>
            )}

            {iOweMoney && (
              <button
                onClick={() => onPayDebt(c.id, "property")}
                className="absolute inset-0 bg-red-950/90 border-2 border-red-500 rounded-md flex items-center justify-center text-white font-black text-[7px] uppercase tracking-wider shadow opacity-90 cursor-pointer z-10"
              >
                Pay
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
