import React, { useState } from "react";
import { GameCardView } from "./GameCardView";
import { RefreshCw, Layers } from "lucide-react";
import type { Player } from "../types";

interface PlayerPropertiesProps {
  propertySets: Player["propertySets"];
  iOweMoney: boolean;
  onPayDebt: (cardId: string, source: "bank" | "property") => void;
  onReorganizeWildcard?: (
    cardId: string,
    fromColor: string,
    toColor: string,
  ) => void;
  isMyTurn?: boolean;
  onSelectProperty?: (cardId: string) => void;
  selectedOfferId?: string | null;
  activeBuildingCardId?: string | null;
  buildingType?: "house" | "hotel" | null;
  onBuildModifier?: (targetColor: string) => void;
}

// Official Monopoly Deal Rent Scale Matrix Dictionary
const rentPriceMatrix: Record<string, { scale: number[]; target: number }> = {
  darkblue: { scale: [3, 8], target: 2 },
  green: { scale: [2, 4, 7], target: 3 },
  yellow: { scale: [2, 4, 6], target: 3 },
  red: { scale: [2, 3, 6], target: 3 },
  orange: { scale: [1, 3, 5], target: 3 },
  pink: { scale: [1, 2, 4], target: 3 },
  lightblue: { scale: [1, 2, 3], target: 3 },
  brown: { scale: [1, 2], target: 2 },
  railroad: { scale: [1, 2, 3, 4], target: 4 },
  utility: { scale: [1, 2], target: 2 },
};

export const PlayerProperties: React.FC<PlayerPropertiesProps> = ({
  propertySets,
  iOweMoney,
  onPayDebt,
  onReorganizeWildcard,
  isMyTurn = false,
  onSelectProperty,
  selectedOfferId,
  activeBuildingCardId,
  buildingType,
  onBuildModifier,
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

  // Utility to calculate real-time rent values based on active building modifications
  const calculateLiveRent = (
    color: string,
    cardCount: number,
    cards: any[],
  ) => {
    // Strip clone index variations (e.g. read "green" out of "green_2")
    const baseColor = color.split("_")[0];
    const scheme = rentPriceMatrix[baseColor];
    if (!scheme || cardCount === 0) return 0;

    const maxIdx = scheme.scale.length - 1;
    const lookupIdx = Math.min(cardCount - 1, maxIdx);
    let currentRent = scheme.scale[lookupIdx];

    // Add +3M for houses and +4M for hotels built on top of full sets
    cards.forEach((c) => {
      if (c.cardType === "action") {
        if (c.actionType === "house") currentRent += 3;
        if (c.actionType === "hotel") currentRent += 4;
      }
    });

    return currentRent;
  };

  const getTargetSetCount = (color: string) => {
    const baseColor = color.split("_")[0];
    return rentPriceMatrix[baseColor]?.target || 3;
  };

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-3xl shadow-xl h-full backdrop-blur-sm relative">
      <div className="flex items-center gap-2 text-xs font-black text-blue-400 mb-3 uppercase tracking-widest border-b border-slate-900/60 pb-2">
        <Layers size={14} />
        <span>Your Real Estate Claims & Rent Schemes</span>
      </div>

      <div className="flex flex-wrap gap-3 min-h-35 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-900/40 items-start justify-start overflow-x-auto">
        {Object.entries(propertySets).map(([color, set]) => {
          if (set.cards.length === 0) return null;

          const totalCards = set.cards.length;
          const targetNeeded = getTargetSetCount(color);
          const activeRent = calculateLiveRent(color, totalCards, set.cards);

          const isSetComplete = set.isComplete;
          const isEligibleForBuilding =
            isSetComplete &&
            color !== "railroad" &&
            color !== "utility" &&
            !!activeBuildingCardId;

          const hasHouse = set.cards.some(
            (c: any) => c.type === "action" && c.actionType === "house",
          );
          const hasHotel = set.cards.some(
            (c: any) => c.type === "action" && c.actionType === "hotel",
          );

          let showBuildOverlay = false;
          if (isEligibleForBuilding && buildingType === "house" && !hasHouse)
            showBuildOverlay = true;
          if (
            isEligibleForBuilding &&
            buildingType === "hotel" &&
            hasHouse &&
            !hasHotel
          )
            showBuildOverlay = true;

          return (
            <div
              key={color}
              className="flex flex-col gap-1.5 bg-slate-900/50 border border-slate-800/80 p-2 rounded-xl shadow-inner min-w-30 max-w-35"
            >
              {showBuildOverlay && onBuildModifier && (
                <button
                  onClick={() => onBuildModifier(color)}
                  className="absolute inset-0 z-30 bg-amber-600/90 border-2 border-amber-400 rounded-xl flex flex-col items-center justify-center text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-2xl scale-102 transition-transform cursor-pointer animate-pulse"
                >
                  <span>🏗️ Upgrade</span>
                  <span className="text-[7px] tracking-normal font-mono opacity-80 mt-0.5">
                    Add {buildingType}
                  </span>
                </button>
              )}
              {/* 📊 DYNAMIC RENT OVERVIEW SCHEME BANNER */}
              <div className="text-center p-1 rounded bg-slate-950 border border-slate-800 flex flex-col gap-0.5">
                <span className="text-[8px] font-black uppercase text-slate-200 tracking-wider truncate">
                  🎨 {color.split("_")[0]}
                </span>
                <div className="flex items-center justify-between text-[7px] font-mono font-bold text-slate-400 border-t border-slate-900 pt-0.5 px-0.5">
                  <span>
                    📈 {totalCards}/{targetNeeded}
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    💰 Rent: {activeRent}M
                  </span>
                </div>
              </div>

              {/* Tight, neat nested card stacks */}
              <div className="flex flex-col gap-1 mt-1">
                {set.cards.map((c, idx) => {
                  const isWildcard = c.type === "wildcard";
                  const isMenuOpen = activeWildcardId === c.id;
                  const isCompleteWild = (c as any).isCompleteWild === true;
                  const colorsAvailable = isCompleteWild
                    ? allGameColors
                    : (c as any).colorsAvailable || [];
                  const isThisCardSelected = selectedOfferId === c.id;
                  return (
                    <div
                      key={`${c.id}-${idx}`}
                      onClick={() => !iOweMoney && onSelectProperty?.(c.id)}
                      className={`relative group transition-transform duration-200 cursor-pointer rounded-xl ${
                        isThisCardSelected
                          ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-950 scale-105 z-10"
                          : ""
                      }`}
                    >
                      {/* 💎 CRITICAL FIX: Shrinks laid table cards instantly */}
                      <GameCardView card={c} isCompact={true} />

                      {/* Interactive Wildcard color switcher */}
                      {isMyTurn &&
                        isWildcard &&
                        !iOweMoney &&
                        onReorganizeWildcard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWildcardId(isMenuOpen ? null : c.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-0.5 bg-slate-950 border border-slate-800 text-blue-400 rounded hover:border-blue-500 z-20 cursor-pointer shadow"
                          >
                            <RefreshCw
                              size={8}
                              className={isMenuOpen ? "animate-spin" : ""}
                            />
                          </button>
                        )}

                      {isMenuOpen && (
                        <div className="absolute inset-x-0.5 top-6 bg-slate-950 border border-blue-900 rounded-lg p-1 shadow-2xl z-30 flex flex-col gap-0.5 max-h-22.5 overflow-y-auto">
                          {colorsAvailable
                            .filter(
                              (targetColor: string) => targetColor !== color,
                            )
                            .map((targetColor: string) => (
                              <button
                                key={targetColor}
                                onClick={() => {
                                  onReorganizeWildcard?.(
                                    c.id,
                                    color,
                                    targetColor,
                                  );
                                  setActiveWildcardId(null);
                                }}
                                className="w-full text-[7px] font-black uppercase py-0.5 px-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white text-left transition-colors truncate"
                              >
                                ➡️ {targetColor}
                              </button>
                            ))}
                        </div>
                      )}

                      {iOweMoney && (
                        <button
                          onClick={() => onPayDebt(c.id, "property")}
                          className="absolute inset-0 bg-red-950/90 border border-red-500 rounded-xl flex items-center justify-center text-white font-black text-[8px] uppercase tracking-wider shadow-xl opacity-90 hover:opacity-100 cursor-pointer z-10"
                        >
                          Surrender
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
