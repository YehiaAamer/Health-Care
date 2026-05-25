import React from "react";

interface LoadingDotsProps {
  size?: number; // px
  colorClass?: string; // tailwind color class for background, e.g. 'bg-primary'
  className?: string;
}

export default function LoadingDots({ size = 10, colorClass = "bg-primary", className = "" }: LoadingDotsProps) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  } as React.CSSProperties;

  return (
    <div className={`flex items-end gap-2 ${className}`} role="status" aria-label="loading">
      <style>{`
        @keyframes ld-jump {
          0% { transform: translateY(0); opacity: 0.9; }
          40% { transform: translateY(-12px); opacity: 1; }
          80% { transform: translateY(0); opacity: 0.9; }
          100% { transform: translateY(0); opacity: 0.9; }
        }
        .ld-dot { border-radius: 9999px; display: inline-block; }
      `}</style>

      <span className={`ld-dot ${colorClass}`} style={{ ...style, animation: `ld-jump 0.9s ease-in-out infinite`, animationDelay: `0s` }} />
      <span className={`ld-dot ${colorClass}`} style={{ ...style, animation: `ld-jump 0.9s ease-in-out infinite`, animationDelay: `0.15s` }} />
      <span className={`ld-dot ${colorClass}`} style={{ ...style, animation: `ld-jump 0.9s ease-in-out infinite`, animationDelay: `0.3s` }} />
      <span className={`ld-dot ${colorClass}`} style={{ ...style, animation: `ld-jump 0.9s ease-in-out infinite`, animationDelay: `0.45s` }} />
    </div>
  );
}
