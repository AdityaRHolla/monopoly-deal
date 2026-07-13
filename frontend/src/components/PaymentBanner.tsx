import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PaymentState } from "../types";

interface PaymentBannerProps {
  paymentState: PaymentState | undefined;
  iOweMoney: boolean;
}

export const PaymentBanner: React.FC<PaymentBannerProps> = ({
  paymentState,
  iOweMoney,
}) => {
  if (!paymentState) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div
        className={`p-2.5 rounded-xl border shadow-xl flex items-center justify-between backdrop-blur-md ${
          iOweMoney
            ? "bg-red-950/90 border-red-500 text-red-200"
            : "bg-amber-950/90 border-amber-500 text-amber-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className={iOweMoney ? "text-red-400" : "text-amber-400"}
          />
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider">
              {iOweMoney ? "⚠️ SETTLE OBLIGATION" : "📢 PENDING TRANSACTION"}
            </h4>
            <p className="text-[9px] font-bold opacity-90">
              {iOweMoney
                ? `Select table cards to clear ${paymentState.amountOwed}M`
                : "Waiting for opponents..."}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">
          {paymentState.amountOwed}M
        </span>
      </div>
    </div>
  );
};
