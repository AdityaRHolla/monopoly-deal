import React from "react";
// import type { GameRoom } from "../types";

interface MatchResultsModalProps {
  status: "waiting" | "playing" | "ended";
  winnerName: string | undefined;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  status,
  winnerName,
}) => {
  if (status !== "ended") return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm p-6 bg-linear-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl shadow-2xl shadow-amber-950/40 text-center relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse" />

        <span className="inline-block px-3 py-1 bg-amber-950 border border-amber-500/40 text-amber-400 text-[9px] font-black tracking-widest uppercase rounded-full">
          👑 Match Results
        </span>

        <h2 className="text-2xl font-black bg-linear-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent uppercase mt-4 tracking-wider animate-bounce">
          Victory Declared!
        </h2>

        <p className="text-xs font-bold text-slate-300 mt-2 max-w-xs mx-auto leading-relaxed">
          A strategic mastermind has compiled{" "}
          <span className="text-amber-400 font-extrabold">
            3 completed property sets
          </span>{" "}
          and conquered the felt table!
        </p>

        <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Room Champion:
          </p>
          <p className="text-xl font-black text-slate-100 uppercase tracking-wide mt-1">
            {winnerName || "Anonymous Player"}
          </p>
        </div>

        <button
          onClick={() => {
            window.location.reload();
          }}
          className="w-full mt-6 py-3 bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-950/40 transform active:scale-[0.98] cursor-pointer"
        >
          🚪 Exit to Main Menu
        </button>
      </div>
    </div>
  );
};
