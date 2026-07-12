import React from "react";
import type { Player } from "../types";

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (targetId: string) => void;
  opponents: Player[];
  title?: string;
  subtitle?: string;
}

export const TargetModal: React.FC<TargetModalProps> = ({
  isOpen,
  onClose,
  onSelectTarget,
  opponents,
  title = "Choose Target Opponent",
  subtitle = "Select which player to target:",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Headings */}
        <h3 className="text-base font-black text-slate-100 uppercase tracking-wider text-center">
          🎯 {title}
        </h3>
        <p className="text-xs text-slate-400 text-center mt-1">{subtitle}</p>

        {/* Dynamic Opponent Buttons */}
        <div className="mt-4 space-y-2">
          {opponents.map((opp) => (
            <button
              key={opp.id}
              onClick={() => onSelectTarget(opp.id)}
              className="w-full py-2.5 px-4 bg-slate-950 border border-slate-800/80 hover:border-blue-500 rounded-xl font-bold text-sm text-left hover:text-blue-400 transition-all active:scale-[0.98]"
            >
              {opp.name}
            </button>
          ))}
        </div>

        {/* Cancel Action Trigger */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 border border-dashed border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-400 hover:text-slate-300 rounded-xl transition-colors"
        >
          Cancel Action
        </button>
      </div>
    </div>
  );
};
