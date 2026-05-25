import { useRef } from "react";
import { useIsVisible } from "@/hooks/useIsVisible";

export default function AnimatedDiv({ className = "", children }) {
  const ref = useRef();
  const isVisible = useIsVisible(ref);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}
