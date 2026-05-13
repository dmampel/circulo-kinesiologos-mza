import React from "react";

interface WaveTransitionProps {
  className?: string;
  color?: string;
  position?: "top" | "bottom";
}

export default function WaveTransition({
  className = "",
  color = "text-slate-50",
  position = "bottom",
}: WaveTransitionProps) {
  return (
    <div
      className={`absolute ${
        position === "bottom" ? "bottom-0" : "top-0 rotate-180"
      } left-0 w-full overflow-hidden leading-none z-10 transform ${
        position === "bottom" ? "translate-y-[1px]" : "-translate-y-[1px]"
      } ${className}`}
    >
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className={`relative block w-full h-32 sm:h-48 md:h-64 ${color} fill-current`}
      >
        <path
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
}
