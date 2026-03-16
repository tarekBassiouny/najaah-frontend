"use client";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { SetStateActionType } from "@/types/set-state-action-type";
import { useLocale } from "@/features/localization/locale-context";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
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
  const focusReturnRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      focusReturnRef.current = document.activeElement as HTMLElement;

      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.removeProperty("pointer-events");

      setTimeout(() => {
        focusReturnRef.current?.focus();
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
    <DropdownContext.Provider
      value={{ isOpen, handleOpen, handleClose, triggerRef }}
    >
      <div onKeyDown={handleKeyDown}>{children}</div>
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
  const { isOpen, handleClose, triggerRef } = useDropdownContext();
  const isRtl = locale === "ar";
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  }>({ top: 0, left: 0, openUp: false });

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

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const gap = 8;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const openUp =
      spaceBelow < contentRect.height + gap && triggerRect.top > spaceBelow;

    let top: number;
    if (openUp) {
      top = triggerRect.top - contentRect.height - gap + window.scrollY;
    } else {
      top = triggerRect.bottom + gap + window.scrollY;
    }

    let left: number;
    if (align === "center") {
      left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
    } else if (align === "end") {
      left = isRtl ? triggerRect.left : triggerRect.right - contentRect.width;
    } else {
      left = isRtl ? triggerRect.right - contentRect.width : triggerRect.left;
    }

    // Clamp horizontally to viewport
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - contentRect.width - 8),
    );

    setPosition({ top, left, openUp });
  }, [align, isRtl, triggerRef, contentRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    calculatePosition();
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("scroll", calculatePosition, true);
    window.addEventListener("resize", calculatePosition);
    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isOpen, calculatePosition]);

  const originClass =
    align === "center"
      ? position.openUp
        ? "origin-bottom"
        : "origin-top"
      : align === "end"
        ? isRtl
          ? position.openUp
            ? "origin-bottom-left"
            : "origin-top-left"
          : position.openUp
            ? "origin-bottom-right"
            : "origin-top-right"
        : isRtl
          ? position.openUp
            ? "origin-bottom-right"
            : "origin-top-right"
          : position.openUp
            ? "origin-bottom-left"
            : "origin-top-left";

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
      className={cn(
        "animate-in fade-in-0 zoom-in-95 pointer-events-auto z-99 min-w-[8rem] rounded-lg",
        isRtl &&
          "[&_[role='menuitem']]:!text-right [&_a]:!text-right [&_button]:!text-right",
        originClass,
        className,
      )}
    >
      {children}
    </div>,
    document.body,
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
  const { handleOpen, isOpen, triggerRef } = useDropdownContext();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    handleOpen();
  };

  return (
    <button
      ref={triggerRef}
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
