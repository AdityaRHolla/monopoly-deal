import React from "react";

interface PokerChipsProps {
  cardCount: number;
  color: string;
}

export const PokerChips: React.FC<PokerChipsProps> = ({ cardCount, color }) => {
  // Simple mapping utility to assign authentic hex colors to individual chips
  const bgMap: Record<string, string> = {
    darkblue: "#1e40af",
    lightblue: "#38bdf8",
    green: "#047857",
    yellow: "#eab308",
    red: "#e11d48",
    orange: "#f97316",
    pink: "#ec4899",
    brown: "#78350f",
    railroad: "#27272a",
    utility: "#65a30d",
  };

  const chipColor = bgMap[color.split("_")[0]] || "#475569";

  return (
    <div className="flex gap-0.5 items-center justify-center py-0.5 border-b border-slate-900/60 mb-1 select-none">
      {Array.from({ length: cardCount }).map((_, idx) => (
        <div
          key={idx}
          className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-md flex flex-col justify-center items-center transform transition-transform hover:scale-110"
          style={{ backgroundColor: chipColor }}
          title={`Asset Item Stack: ${idx + 1}`}
        >
          {/* Inner plastic horizontal chip indent accent */}
          <div className="w-1.5 h-0.5 bg-white/30 rounded-full" />
        </div>
      ))}
    </div>
  );
};
