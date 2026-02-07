"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { can, type Capability } from "@/lib/capabilities";
import { getAuthPermissions } from "@/lib/auth-state";
import { cn } from "@/lib/utils";
import { ChevronUp, ArrowLeftIcon, type PropsType } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

type SidebarSubItem = {
  title: string;
  url: string;
  capability?: Capability;
};

type SidebarItem = {
  title: string;
  url?: string;
  icon?: ComponentType<PropsType>;
  capability?: Capability;
  items: SidebarSubItem[];
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

type SidebarProps = {
  sections: SidebarSection[];
};

function normalizePath(path: string) {
  if (!path) return "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function getBasePath(url?: string) {
  if (!url) return "/";
  const segments = url.split("/").filter(Boolean);
  return segments.length ? `/${segments[0]}` : "/";
}

function isPathActive(pathname: string, url?: string) {
  if (!url) return false;
  const current = normalizePath(pathname);
  const target = normalizePath(url);
  const base = getBasePath(url);
  return (
    current === target || current === base || current.startsWith(base + "/")
  );
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const permissions = getAuthPermissions();

  const filteredSections = useMemo(() => {
    if (!permissions) {
      return sections;
    }

    return sections
      .map((section) => {
        const items = section.items
          .map((item) => {
            if (item.items?.length) {
              const subItems = item.items.filter((subItem) =>
                subItem.capability ? can(subItem.capability) : true,
              );

              if (!subItems.length) return null;

              return {
                ...item,
                items: subItems,
              };
            }

            if (item.capability && !can(item.capability)) return null;

            return item;
          })
          .filter(Boolean) as SidebarItem[];

        return items.length ? { ...section, items } : null;
      })
      .filter(Boolean) as SidebarSection[];
  }, [permissions, sections]);

  const activeGroupTitles = useMemo(() => {
    return filteredSections
      .flatMap((section) =>
        section.items
          .filter((item) =>
            item.items.some((subItem) => isPathActive(pathname, subItem.url)),
          )
          .map((item) => item.title),
      )
      .filter(Boolean);
  }, [filteredSections, pathname]);

  useEffect(() => {
    setExpandedItems((prev) => {
      const merged = new Set([...prev, ...activeGroupTitles]);
      return Array.from(merged);
    });
  }, [activeGroupTitles]);

  return (
    <>
      {isMobile && isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "max-w-[290px] shrink-0 overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isMobile ? (isOpen ? "w-full" : "w-0") : "w-[290px]",
        )}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-0 py-2.5 min-[850px]:py-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Image
                  src="/images/logo/logo-icon.svg"
                  width={20}
                  height={20}
                  alt="LMS"
                  className="brightness-0 invert"
                />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                LMS Admin
              </span>
            </Link>

            {isMobile && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
                aria-label="Close Sidebar"
              >
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          <nav className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {filteredSections.map((section) => (
              <div key={section.label} className="mb-6">
                <h3 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h3>

                <ul className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const hasChildren = item.items.length > 0;
                    const isActive = hasChildren
                      ? item.items.some((subItem) =>
                          isPathActive(pathname, subItem.url),
                        )
                      : isPathActive(pathname, item.url);
                    const isExpanded =
                      expandedItems.includes(item.title) || isActive;

                    if (hasChildren) {
                      return (
                        <li key={item.title}>
                          <MenuItem
                            as="button"
                            isActive={isExpanded}
                            onClick={() =>
                              setExpandedItems((prev) =>
                                prev.includes(item.title)
                                  ? prev.filter((key) => key !== item.title)
                                  : [...prev, item.title],
                              )
                            }
                          >
                            <span className="flex items-center gap-3">
                              {Icon ? <Icon className="h-5 w-5" /> : null}
                              <span>{item.title}</span>
                            </span>
                            <ChevronUp
                              className={cn(
                                "ml-auto h-4 w-4 transition-transform duration-200",
                                isExpanded ? "rotate-180" : "rotate-0",
                              )}
                            />
                          </MenuItem>

                          {isExpanded ? (
                            <ul className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2">
                              {item.items.map((subItem) => (
                                <li key={subItem.title}>
                                  <MenuItem
                                    as="link"
                                    href={subItem.url}
                                    isActive={isPathActive(
                                      pathname,
                                      subItem.url,
                                    )}
                                  >
                                    {subItem.title}
                                  </MenuItem>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      );
                    }

                    return (
                      <li key={item.title}>
                        <MenuItem
                          as="link"
                          href={item.url || "/dashboard"}
                          isActive={isActive}
                          className="flex items-center gap-3"
                        >
                          {Icon ? <Icon className="h-5 w-5" /> : null}
                          <span>{item.title}</span>
                        </MenuItem>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
