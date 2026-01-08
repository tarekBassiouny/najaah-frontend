"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { can } from "@/lib/capabilities";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const normalizedPath = useCallback((path: string) => {
    if (!path) return "/";
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }, []);

  const getBasePath = useCallback((url?: string) => {
    if (!url) return "/";
    const segments = url.split("/").filter(Boolean);
    return segments.length ? `/${segments[0]}` : "/";
  }, []);

  const toggleExpanded = useCallback((title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));

    // Uncomment the following line to enable multiple expanded items
    // setExpandedItems((prev) =>
    //   prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    // );
  }, []);

  useEffect(() => {
    const currentPath = normalizedPath(pathname);
    let activeParent: string | null = null;

    NAV_DATA.some((section) =>
      section.items.some((item) => {
        if (!item.items.length) return false;
        const isActive = item.items.some((subItem) => {
          const subItemPath = normalizedPath(subItem.url);
          const basePath = getBasePath(subItem.url);
          return (
            currentPath === subItemPath ||
            currentPath === basePath ||
            currentPath.startsWith(basePath + "/")
          );
        });

        if (isActive) {
          activeParent = item.title;
          return true;
        }

        return false;
      }),
    );

    if (activeParent && !expandedItems.includes(activeParent)) {
      setExpandedItems([activeParent]);
    }
  }, [expandedItems, getBasePath, normalizedPath, pathname]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, isOpen, setIsOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={isMobile ? !isOpen : false}
        inert={isMobile && !isOpen}
      >
        <div
          className={cn(
            "flex h-full flex-col py-10",
            "pl-[25px] pr-[7px]",
          )}
        >
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items
                      .filter((item) =>
                        item.capability ? can(item.capability) : true,
                      )
                      .map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(({ url }) => {
                                const itemPath = normalizedPath(url);
                                const basePath = getBasePath(url);
                                return (
                                  normalizedPath(pathname) === itemPath ||
                                  normalizedPath(pathname) === basePath ||
                                  normalizedPath(pathname).startsWith(
                                    basePath + "/",
                                  )
                                );
                              })}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span>{item.title}</span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expandedItems.includes(item.title) &&
                                    "rotate-0",
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items
                                  .filter((subItem) =>
                                    subItem.capability
                                      ? can(subItem.capability)
                                      : true,
                                  )
                                  .map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={
                                        normalizedPath(pathname) ===
                                          normalizedPath(subItem.url) ||
                                        normalizedPath(pathname) ===
                                          getBasePath(subItem.url) ||
                                        normalizedPath(pathname).startsWith(
                                          `${normalizedPath(subItem.url)}/`,
                                        )
                                      }
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                  item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-3"
                                as="link"
                                href={href}
                                isActive={
                                  normalizedPath(pathname) ===
                                    normalizedPath(href) ||
                                  normalizedPath(pathname).startsWith(
                                    `${normalizedPath(href)}/`,
                                  )
                                }
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span>{item.title}</span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
