import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import LoadingDots from "@/components/shared/LoadingDots";

type GlobalLoaderContextType = {
  show: (autoHideMs?: number) => void;
  hide: () => void;
  isActive: boolean;
};

const GlobalLoaderContext = createContext<GlobalLoaderContextType>({
  show: () => {},
  hide: () => {},
  isActive: false,
});

export const GlobalLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0);
  const timers = useRef<number[]>([]);

  const show = useCallback((autoHideMs = 0) => {
    setCount((c) => c + 1);

    if (autoHideMs > 0) {
      const id = window.setTimeout(() => {
        setCount((c) => Math.max(0, c - 1));
      }, autoHideMs);

      timers.current.push(id);
    }
  }, []);

  const hide = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const isActive = count > 0;

  return (
    <GlobalLoaderContext.Provider value={{ show, hide, isActive }}>
      {children}

      {isActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative pointer-events-auto p-4 rounded-lg">
            <LoadingDots size={12} colorClass="bg-primary" className="" />
          </div>
        </div>
      )}
    </GlobalLoaderContext.Provider>
  );
};

export function useGlobalLoader() {
  return useContext(GlobalLoaderContext);
}

export default GlobalLoaderContext;
