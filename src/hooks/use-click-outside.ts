import { useEffect, useRef } from "react";

type UseClickOutsideOptions = {
  ignore?: (_event: MouseEvent) => boolean;
};

export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  options?: UseClickOutsideOptions,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleEvent(event: MouseEvent) {
      if (options?.ignore?.(event)) return;

      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleEvent);

    return () => {
      document.removeEventListener("mousedown", handleEvent);
    };
  }, [callback, options, ref]);

  return ref;
}
