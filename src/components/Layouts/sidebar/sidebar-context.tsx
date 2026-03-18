"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type SidebarState = "expanded" | "collapsed";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "najaah.sidebar.collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (_value: boolean) => void;
  isMobile: boolean;
  openSidebar: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleCollapse: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isCollapsed = !isMobile && desktopCollapsed;

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored == null) return;
    setDesktopCollapsed(stored === "true");
  }, []);

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(desktopCollapsed),
    );
  }, [desktopCollapsed]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen((prev) => !prev);
      return;
    }

    setDesktopCollapsed((prev) => !prev);
  }, [isMobile]);

  const openSidebar = useCallback(() => {
    if (isMobile) {
      setIsOpen(true);
      return;
    }

    setDesktopCollapsed(false);
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    if (!isMobile) return;
    setIsOpen(false);
  }, [isMobile]);

  const toggleCollapse = useCallback(() => {
    if (isMobile) return;
    setDesktopCollapsed((prev) => !prev);
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        state:
          isMobile && !isOpen
            ? "collapsed"
            : isCollapsed
              ? "collapsed"
              : "expanded",
        isOpen,
        isCollapsed,
        setIsOpen,
        isMobile,
        openSidebar,
        toggleSidebar,
        closeSidebar,
        toggleCollapse,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
