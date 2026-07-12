import React, { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";

export const OrientationLock: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If the viewport height is greater than width, the user is in portrait mode
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    // Run initial check on mount
    checkOrientation();

    // Listen for resize or orientation changes dynamically
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  if (!isPortrait) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-100 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6 text-red-500">
        {/* Animated rotating device indicator icon */}
        <RotateCw size={48} className="animate-spin [animation-duration:3s]" />
      </div>

      <h2 className="text-xl font-black uppercase tracking-wider text-slate-100">
        Rotate Your Device
      </h2>

      <p className="mt-2 text-xs font-bold text-slate-400 max-w-xs leading-relaxed">
        Monopoly Deal requires a wide screen. Please flip your phone
        horizontally to enter the card room.
      </p>
    </div>
  );
};
