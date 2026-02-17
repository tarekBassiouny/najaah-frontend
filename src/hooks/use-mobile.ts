import { useEffect, useState } from "react";

// Matches Tailwind's lg breakpoint (1024px)
export const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (event?: MediaQueryListEvent) => {
      setIsMobile(event?.matches ?? mql.matches);
    };

    setIsMobile(mql.matches);

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Safari < 14 fallback.
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  // Return false during SSR to avoid hydration mismatch
  return isMobile ?? false;
}
