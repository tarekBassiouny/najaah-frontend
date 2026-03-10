"use client";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { SetStateActionType } from "@/types/set-state-action-type";
import { useLocale } from "@/features/localization/locale-context";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from "react";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within a Dropdown");
  }
  return context;
}

type DropdownProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: SetStateActionType<boolean>;
};

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.removeProperty("pointer-events");

      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <DropdownContext.Provider value={{ isOpen, handleOpen, handleClose }}>
      <div className="relative" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownContentProps = {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
  ignoreOutsideClickSelector?: string | string[];
};

export function DropdownContent({
  children,
  align = "center",
  className,
  ignoreOutsideClickSelector,
}: DropdownContentProps) {
  const { locale } = useLocale();
  const { isOpen, handleClose } = useDropdownContext();
  const isRtl = locale === "ar";

  const alignClass =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "end"
        ? isRtl
          ? "left-0"
          : "right-0"
        : isRtl
          ? "right-0"
          : "left-0";

  const originClass =
    align === "center"
      ? "origin-top"
      : align === "end"
        ? isRtl
          ? "origin-top-left"
          : "origin-top-right"
        : isRtl
          ? "origin-top-right"
          : "origin-top-left";

  const contentRef = useClickOutside<HTMLDivElement>(
    () => {
      if (isOpen) handleClose();
    },
    {
      ignore: (event) => {
        if (!ignoreOutsideClickSelector) return false;

        const target = event.target;
        if (!(target instanceof Element)) return false;

        const selectors = Array.isArray(ignoreOutsideClickSelector)
          ? ignoreOutsideClickSelector
          : [ignoreOutsideClickSelector];

        return selectors.some((selector) => Boolean(target.closest(selector)));
      },
    },
  );

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "animate-in fade-in-0 zoom-in-95 pointer-events-auto absolute z-99 mt-2 max-h-[min(24rem,calc(100vh-2rem))] min-w-[8rem] overflow-y-auto overscroll-contain rounded-lg",
        isRtl &&
          "[&_[role='menuitem']]:!text-right [&_a]:!text-right [&_button]:!text-right",
        alignClass,
        originClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

type DropdownTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function DropdownTrigger({
  children,
  className,
  onClick,
  ...props
}: DropdownTriggerProps) {
  const { handleOpen, isOpen } = useDropdownContext();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    handleOpen();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownClose({ children }: PropsWithChildren) {
  const { handleClose } = useDropdownContext();

  return <div onClick={handleClose}>{children}</div>;
}
