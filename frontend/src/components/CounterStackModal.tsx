import React from "react";
import type { CounterStackState, Player } from "../types";

interface CounterStackModalProps {
  counterStack: CounterStackState | undefined;
  isVetoTargetMe: boolean;
  me: Player | undefined;
  handlePlayJustSayNo: (cardId: string) => void;
  handleAcceptActionEffect: () => void;
}

export const CounterStackModal: React.FC<CounterStackModalProps> = ({
  counterStack,
  isVetoTargetMe,
  me,
  handlePlayJustSayNo,
  handleAcceptActionEffect,
}) => {
  if (!counterStack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        <span className="inline-block px-2.5 py-0.5 bg-red-950 border border-red-500/40 text-red-400 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
          Counter Stack Active
        </span>

        <h3 className="text-base font-black text-slate-100 uppercase mt-3 tracking-wide">
          ⚡ {counterStack.originalCard.name}
        </h3>

        <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          An active card event loop is currently frozen on the felt table
          waiting for quick player veto responses.
        </p>

        {isVetoTargetMe ? (
          <div className="mt-5 space-y-2">
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-300">
                Do you hold a response block card?
              </p>

              <div className="flex gap-1.5 justify-center mt-2.5 overflow-x-auto py-0.5">
                {me?.hand
                  .filter(
                    (c) =>
                      c.type === "action" &&
                      (c as any).actionType === "just_say_no",
                  )
                  .map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handlePlayJustSayNo(card.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 border border-red-400/40 text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      💥 JUST SAY NO
                    </button>
                  ))}
                {me?.hand.filter(
                  (c) =>
                    c.type === "action" &&
                    (c as any).actionType === "just_say_no",
                ).length === 0 && (
                  <span className="text-[9px] font-bold text-slate-600 italic py-1">
                    No protective counter cards in hand tray
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleAcceptActionEffect}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              🤝 Accept Consequences (Pass)
            </button>
          </div>
        ) : (
          <div className="mt-5 py-3 bg-slate-950 border border-slate-800/60 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
            ⏳ Awaiting opponent reaction logs...
          </div>
        )}
      </div>
    </div>
  );
};
