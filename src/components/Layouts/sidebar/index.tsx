"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { hasCapability, type Capability } from "@/lib/capabilities";
import { getAuthPermissions } from "@/lib/auth-state";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/use-click-outside";
import { ChevronUp, ArrowLeftIcon, type PropsType } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTenant } from "@/app/tenant-provider";
import { getAdminScope } from "@/lib/user-scope";
import { useTranslation } from "@/features/localization";

type SidebarSubItem = {
  title: string;
  titleKey: string;
  url: string;
  capability?: Capability;
};

type SidebarItem = {
  title: string;
  titleKey: string;
  url?: string;
  icon?: ComponentType<PropsType>;
  capability?: Capability;
  badge?: string;
  badgeKey?: string;
  items: SidebarSubItem[];
};

type SidebarSection = {
  label: string;
  labelKey: string;
  items: SidebarItem[];
};

type SidebarProps = {
  sections: SidebarSection[];
};

function isUnbrandedCenterType(type: unknown) {
  if (type == null) return false;

  if (typeof type === "number") {
    return type === 0;
  }

  if (typeof type === "string") {
    const normalized = type.trim().toLowerCase();
    return normalized === "0" || normalized === "unbranded";
  }

  return false;
}

function normalizePath(path: string) {
  if (!path) return "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function isPathActive(pathname: string, url?: string) {
  if (!url) return false;
  const current = normalizePath(pathname);
  const target = normalizePath(url);
  const segments = target.split("/").filter(Boolean);
  const isCenterRoot = segments.length === 2 && segments[0] === "centers";

  if (
    target === "/centers" &&
    (current.startsWith("/manage/centers/") ||
      current.startsWith("/settings/centers/"))
  ) {
    return true;
  }

  if (isCenterRoot) {
    return current === target;
  }

  return current === target || current.startsWith(target + "/");
}

type SidebarItemLabelProps = {
  title: string;
  titleKey: string;
  badge?: string;
  badgeKey?: string;
  t: (_key: string) => string;
  isRtl: boolean;
};

function SidebarItemLabel({
  title,
  titleKey,
  badge,
  badgeKey,
  t,
  isRtl,
}: SidebarItemLabelProps) {
  const displayTitle = t(titleKey) || title;
  const displayBadge = badgeKey ? t(badgeKey) || badge : badge;

  return (
    <span
      className={cn(
        "flex items-center gap-2",
        isRtl ? "text-right" : "text-left",
      )}
    >
      <span>{displayTitle}</span>
      {displayBadge ? (
        <Badge
          variant="outline"
          className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
        >
          {displayBadge}
        </Badge>
      ) : null}
    </span>
  );
}

function getCompactItemClassName(isActive: boolean) {
  return cn(
    "relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-150",
    isActive
      ? "border-primary/20 bg-primary/10 text-primary shadow-sm dark:border-primary/30 dark:bg-primary/15"
      : "border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-white",
  );
}

type SidebarTooltipProps = {
  label: string;
  side: "left" | "right" | "bottom";
  children: ReactNode;
};

function SidebarTooltip({ label, side, children }: SidebarTooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useMemo(
    () => () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;

      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const gap = 12;

      let top =
        triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      let left =
        side === "right"
          ? triggerRect.right + gap
          : triggerRect.left - tooltipRect.width - gap;

      if (side === "bottom") {
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      }

      top = Math.max(
        8,
        Math.min(top, window.innerHeight - tooltipRect.height - 8),
      );
      left = Math.max(
        8,
        Math.min(left, window.innerWidth - tooltipRect.width - 8),
      );

      setPosition({ top, left });
    },
    [side],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      {isOpen
        ? createPortal(
            <div
              id={tooltipId}
              ref={tooltipRef}
              role="tooltip"
              className="pointer-events-none fixed z-[120] rounded-xl bg-gray-950 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-gray-950/20 dark:bg-white dark:text-gray-900 dark:shadow-black/20"
              style={{ top: position.top, left: position.left }}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

type SidebarCollapsedLinkProps = {
  href: string;
  title: string;
  icon?: ComponentType<PropsType>;
  isActive: boolean;
  isRtl: boolean;
  tooltipSide: "left" | "right";
};

function SidebarCollapsedLink({
  href,
  title,
  icon: Icon,
  isActive,
  isRtl,
  tooltipSide,
}: SidebarCollapsedLinkProps) {
  return (
    <SidebarTooltip label={title} side={tooltipSide}>
      <Link
        href={href}
        aria-label={title}
        className={getCompactItemClassName(isActive)}
      >
        {Icon ? <Icon className="h-5 w-5" /> : <span>{title.charAt(0)}</span>}
        {isActive ? (
          <span
            className={cn(
              "absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary",
              isRtl ? "-left-1" : "-right-1",
            )}
          />
        ) : null}
      </Link>
    </SidebarTooltip>
  );
}

type SidebarCollapsedGroupProps = {
  item: SidebarItem;
  pathname: string;
  t: (_key: string) => string;
  isRtl: boolean;
  tooltipSide: "left" | "right";
};

function SidebarCollapsedGroup({
  item,
  pathname,
  t,
  isRtl,
  tooltipSide,
}: SidebarCollapsedGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;
  const title = t(item.titleKey) || item.title;
  const isActive = item.items.some((subItem) =>
    isPathActive(pathname, subItem.url),
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false), {
    ignore: (event) =>
      Boolean(
        triggerRef.current?.contains(event.target as Node | null) ?? false,
      ),
  });
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useMemo(
    () => () => {
      const trigger = triggerRef.current;
      const flyout = flyoutRef.current;

      if (!trigger || !flyout) return;

      const triggerRect = trigger.getBoundingClientRect();
      const flyoutRect = flyout.getBoundingClientRect();
      const gap = 14;
      const top = Math.max(
        8,
        Math.min(
          triggerRect.top + triggerRect.height / 2 - flyoutRect.height / 2,
          window.innerHeight - flyoutRect.height - 8,
        ),
      );
      const left = Math.max(
        8,
        Math.min(
          isRtl
            ? triggerRect.left - flyoutRect.width - gap
            : triggerRect.right + gap,
          window.innerWidth - flyoutRect.width - 8,
        ),
      );

      setPosition({ top, left });
    },
    [flyoutRef, isRtl],
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      <SidebarTooltip label={title} side={tooltipSide}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={getCompactItemClassName(isActive)}
          aria-label={title}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {Icon ? <Icon className="h-5 w-5" /> : <span>{title.charAt(0)}</span>}
          <span
            className={cn(
              "absolute bottom-1 h-1.5 w-1.5 rounded-full bg-current opacity-50",
              isRtl ? "left-1" : "right-1",
            )}
          />
        </button>
      </SidebarTooltip>

      {isOpen
        ? createPortal(
            <div
              ref={flyoutRef}
              role="menu"
              aria-label={title}
              className="fixed z-[115] w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-dark dark:shadow-black/25"
              style={{ top: position.top, left: position.left }}
            >
              <div
                className={cn(
                  "px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500",
                  isRtl ? "text-right" : "text-left",
                )}
              >
                {title}
              </div>

              <ul className="space-y-1">
                {item.items.map((subItem) => (
                  <li key={subItem.title}>
                    <Link
                      href={subItem.url}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isPathActive(pathname, subItem.url)
                          ? "bg-primary/10 text-primary dark:bg-primary/20"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                        isRtl ? "text-right" : "text-left",
                      )}
                    >
                      {t(subItem.titleKey) || subItem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, isMobile, isCollapsed, closeSidebar, toggleCollapse } =
    useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { t, locale } = useTranslation();
  const isRtl = locale === "ar";
  const {
    centerSlug: tenantCenterSlug,
    centerName: tenantCenterName,
    branding,
  } = useTenant();
  const { data: currentAdmin } = useAdminMe();
  const userScope = getAdminScope(currentAdmin);
  const profilePermissions = currentAdmin?.permissions;
  const permissions = useMemo(() => {
    if (Array.isArray(profilePermissions)) {
      return profilePermissions;
    }

    const fallbackPermissions = getAuthPermissions();
    return Array.isArray(fallbackPermissions) ? fallbackPermissions : [];
  }, [profilePermissions]);
  const centerId = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "centers") return null;
    const candidate = segments[1];
    if (
      !candidate ||
      candidate === "create" ||
      candidate === "list" ||
      candidate === "settings"
    ) {
      return null;
    }
    return candidate;
  }, [pathname]);
  const scopedCenterIdForRestrictions =
    centerId ?? (userScope.isCenterAdmin ? userScope.centerId : null);
  const { data: center } = useCenter(
    scopedCenterIdForRestrictions ?? undefined,
  );
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);
  const centerName =
    center?.name ??
    (centerId ? t("sidebar.centerWithId", { id: centerId }) : null);
  const isTenantSubdomainCenter = Boolean(tenantCenterSlug);
  const subdomainCenterName =
    tenantCenterName || tenantCenterSlug || t("common.labels.center");
  const subdomainCenterLogo =
    typeof branding?.logoUrl === "string" ? branding.logoUrl : null;

  const filteredSections = useMemo(() => {
    return sections
      .map((section) => {
        const items = section.items
          .filter(
            (item) =>
              !(
                isUnbrandedCenter &&
                (item.title === "Surveys" ||
                  item.title === "Education" ||
                  item.title === "Landing Page")
              ),
          )
          .map((item) => {
            if (item.items?.length) {
              const subItems = item.items.filter((subItem) =>
                subItem.capability
                  ? hasCapability(subItem.capability, permissions)
                  : true,
              );

              if (!subItems.length) return null;

              return {
                ...item,
                items: subItems,
              };
            }

            if (
              item.capability &&
              !hasCapability(item.capability, permissions)
            ) {
              return null;
            }

            return item;
          })
          .filter(Boolean) as SidebarItem[];

        return items.length ? { ...section, items } : null;
      })
      .filter(Boolean) as SidebarSection[];
  }, [isUnbrandedCenter, permissions, sections]);

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

  const collapseToggleLabel = isCollapsed
    ? t("sidebar.expandSidebar")
    : t("sidebar.collapseSidebar");
  const collapseTogglePointsRight = isCollapsed ? !isRtl : isRtl;
  const railTooltipSide = isRtl ? "left" : "right";

  return (
    <>
      {isMobile && isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "max-w-[290px] shrink-0 overflow-hidden border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isRtl ? "border-l" : "border-r",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isMobile
            ? isOpen
              ? "w-full"
              : "w-0"
            : isCollapsed
              ? "w-[88px]"
              : "w-[290px]",
        )}
      >
        <div
          className={cn(
            "flex h-full flex-col py-10",
            isCollapsed && !isMobile ? "px-4" : "pl-[25px] pr-[7px]",
          )}
        >
          {!isMobile ? (
            <div
              className={cn(
                "mb-4 flex",
                isCollapsed ? "justify-center" : "justify-end",
              )}
            >
              <SidebarTooltip
                label={collapseToggleLabel}
                side={isCollapsed ? railTooltipSide : "bottom"}
              >
                <button
                  type="button"
                  onClick={toggleCollapse}
                  aria-label={collapseToggleLabel}
                  className={cn(
                    "group border-gray-200 text-gray-600 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary/30 dark:hover:bg-primary/10 dark:hover:text-primary",
                    isCollapsed
                      ? "flex h-11 w-11 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-gray-dark"
                      : cn(
                          "inline-flex h-11 items-center gap-2 rounded-2xl border bg-gray-50/80 px-3 text-sm font-semibold shadow-sm dark:bg-gray-800/70",
                          isRtl && "flex-row-reverse",
                        ),
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-gray-500 transition-colors group-hover:text-primary dark:bg-gray-dark dark:text-gray-300">
                    <ArrowLeftIcon
                      className={cn(
                        "h-4 w-4 transition-transform",
                        collapseTogglePointsRight && "rotate-180",
                      )}
                    />
                  </span>
                  {!isCollapsed ? (
                    <span className="whitespace-nowrap">
                      {collapseToggleLabel}
                    </span>
                  ) : null}
                </button>
              </SidebarTooltip>
            </div>
          ) : null}

          {isCollapsed && !isMobile ? (
            <>
              <div className="flex flex-col items-center gap-3">
                {centerId && userScope.isSystemAdmin ? (
                  <SidebarTooltip
                    label={t("sidebar.backToCenters")}
                    side={railTooltipSide}
                  >
                    <Link
                      href="/centers"
                      aria-label={t("sidebar.backToCenters")}
                      className={getCompactItemClassName(false)}
                    >
                      <ArrowLeftIcon
                        className={cn("h-4 w-4", isRtl && "rotate-180")}
                      />
                    </Link>
                  </SidebarTooltip>
                ) : null}

                {centerId ? (
                  <SidebarTooltip
                    label={centerName ?? t("common.labels.center")}
                    side={railTooltipSide}
                  >
                    <Link
                      href={`/centers/${centerId}`}
                      aria-label={centerName ?? t("common.labels.center")}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-primary transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-dark dark:hover:border-gray-600"
                    >
                      {(centerName ?? "C").charAt(0).toUpperCase()}
                    </Link>
                  </SidebarTooltip>
                ) : isTenantSubdomainCenter ? (
                  <SidebarTooltip
                    label={subdomainCenterName}
                    side={railTooltipSide}
                  >
                    <Link
                      href="/dashboard"
                      aria-label={subdomainCenterName}
                      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-primary transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-dark dark:hover:border-gray-600"
                    >
                      {subdomainCenterLogo ? (
                        <div
                          className="h-full w-full bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url(${subdomainCenterLogo})`,
                          }}
                          role="img"
                          aria-label={t("sidebar.centerLogoAriaLabel", {
                            name: subdomainCenterName,
                          })}
                        />
                      ) : (
                        subdomainCenterName.charAt(0).toUpperCase()
                      )}
                    </Link>
                  </SidebarTooltip>
                ) : (
                  <SidebarTooltip
                    label={t("sidebar.najaahAdmin")}
                    side={railTooltipSide}
                  >
                    <Link
                      href="/dashboard"
                      aria-label={t("sidebar.najaahAdmin")}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary"
                    >
                      <Image
                        src="/images/logo/logo-icon.svg"
                        width={20}
                        height={20}
                        alt={t("header.logoAlt")}
                        className="brightness-0 invert"
                      />
                    </Link>
                  </SidebarTooltip>
                )}
              </div>

              <nav className="custom-scrollbar mt-6 flex-1 overflow-y-auto">
                {filteredSections.map((section, sectionIndex) => (
                  <div
                    key={section.label}
                    className="flex flex-col items-center gap-2 pb-4"
                  >
                    {sectionIndex > 0 ? (
                      <div className="my-2 h-px w-8 bg-gray-200 dark:bg-gray-800" />
                    ) : null}

                    {section.items.map((item) => {
                      const hasChildren = item.items.length > 0;
                      const isActive = hasChildren
                        ? item.items.some((subItem) =>
                            isPathActive(pathname, subItem.url),
                          )
                        : isPathActive(pathname, item.url);

                      return hasChildren ? (
                        <SidebarCollapsedGroup
                          key={item.title}
                          item={item}
                          pathname={pathname}
                          t={t}
                          isRtl={isRtl}
                          tooltipSide={railTooltipSide}
                        />
                      ) : (
                        <SidebarCollapsedLink
                          key={item.title}
                          href={item.url || "/dashboard"}
                          title={t(item.titleKey) || item.title}
                          icon={item.icon}
                          isActive={isActive}
                          isRtl={isRtl}
                          tooltipSide={railTooltipSide}
                        />
                      );
                    })}
                  </div>
                ))}
              </nav>
            </>
          ) : (
            <>
              <div className={cn("relative", isMobile && "pr-4.5")}>
                {centerId ? (
                  <div className="space-y-4">
                    {userScope.isSystemAdmin && (
                      <div className="flex items-center justify-between">
                        <Link
                          href="/centers"
                          className={cn(
                            "flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
                            isRtl && "text-right",
                          )}
                        >
                          <ArrowLeftIcon
                            className={cn("h-4 w-4", isRtl && "rotate-180")}
                          />
                          {t("sidebar.backToCenters")}
                        </Link>

                        {isMobile && (
                          <button
                            type="button"
                            onClick={closeSidebar}
                            className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            aria-label={t("sidebar.closeSidebarAriaLabel")}
                          >
                            <ArrowLeftIcon className="size-6" />
                          </button>
                        )}
                      </div>
                    )}

                    {userScope.isCenterAdmin && isMobile && (
                      <div
                        className={cn(
                          "flex",
                          isRtl ? "justify-start" : "justify-end",
                        )}
                      >
                        <button
                          type="button"
                          onClick={closeSidebar}
                          className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          aria-label={t("sidebar.closeSidebarAriaLabel")}
                        >
                          <ArrowLeftIcon
                            className={cn("size-6", isRtl && "rotate-180")}
                          />
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/centers/${centerId}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                        isRtl && "text-right",
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {(centerName ?? "C").charAt(0).toUpperCase()}
                      </div>
                      <div className={cn("min-w-0", isRtl && "text-right")}>
                        <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {t("common.labels.center")}
                        </span>
                        <span className="block truncate text-base font-semibold text-gray-900 dark:text-white">
                          {centerName ?? t("common.labels.center")}
                        </span>
                      </div>
                    </Link>
                  </div>
                ) : isTenantSubdomainCenter ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                        isRtl && "text-right",
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                        {subdomainCenterLogo ? (
                          <div
                            className="h-full w-full bg-cover bg-center bg-no-repeat"
                            style={{
                              backgroundImage: `url(${subdomainCenterLogo})`,
                            }}
                            role="img"
                            aria-label={t("sidebar.centerLogoAriaLabel", {
                              name: subdomainCenterName,
                            })}
                          />
                        ) : (
                          subdomainCenterName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className={cn("min-w-0", isRtl && "text-right")}>
                        <span className="block text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {t("common.labels.center")}
                        </span>
                        <span className="block truncate text-base font-semibold text-gray-900 dark:text-white">
                          {subdomainCenterName}
                        </span>
                      </div>
                    </Link>

                    {isMobile && (
                      <button
                        type="button"
                        onClick={closeSidebar}
                        className="absolute right-4.5 top-1/2 -translate-y-1/2 text-right"
                        aria-label={t("sidebar.closeSidebarAriaLabel")}
                      >
                        <ArrowLeftIcon className="ml-auto size-7" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex items-center gap-2 px-0 py-2.5 min-[850px]:py-0",
                        isRtl && "text-right",
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Image
                          src="/images/logo/logo-icon.svg"
                          width={20}
                          height={20}
                          alt={t("header.logoAlt")}
                          className="brightness-0 invert"
                        />
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {t("sidebar.najaahAdmin")}
                      </span>
                    </Link>

                    {isMobile && (
                      <button
                        type="button"
                        onClick={closeSidebar}
                        className="absolute right-4.5 top-1/2 -translate-y-1/2 text-right"
                        aria-label={t("sidebar.closeSidebarAriaLabel")}
                      >
                        <ArrowLeftIcon className="ml-auto size-7" />
                      </button>
                    )}
                  </>
                )}
              </div>

              <nav
                className={cn(
                  "custom-scrollbar mt-6 flex-1 overflow-y-auto min-[850px]:mt-10",
                  isRtl ? "pl-3" : "pr-3",
                )}
              >
                {filteredSections.map((section) => (
                  <div key={section.label} className="mb-6">
                    <h3
                      className={cn(
                        "mb-5 text-sm font-medium text-dark-4 dark:text-dark-6",
                        isRtl ? "text-right" : "text-left",
                      )}
                    >
                      {t(section.labelKey) || section.label}
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
                                <span
                                  className={cn(
                                    "flex items-center gap-3",
                                    isRtl && "text-right",
                                  )}
                                >
                                  {Icon ? <Icon className="h-5 w-5" /> : null}
                                  <SidebarItemLabel
                                    title={item.title}
                                    titleKey={item.titleKey}
                                    badge={item.badge}
                                    badgeKey={item.badgeKey}
                                    t={t}
                                    isRtl={isRtl}
                                  />
                                </span>
                                <ChevronUp
                                  className={cn(
                                    "h-4 w-4 shrink-0 transition-transform duration-200",
                                    isExpanded ? "rotate-180" : "rotate-0",
                                  )}
                                />
                              </MenuItem>

                              {isExpanded ? (
                                <ul
                                  className={cn(
                                    "space-y-1.5 pb-[15px] pt-2",
                                    isRtl
                                      ? "mr-9 text-right"
                                      : "ml-9 text-left",
                                  )}
                                >
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
                                        {t(subItem.titleKey) || subItem.title}
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
                              className={cn(
                                "flex items-center gap-3",
                                isRtl && "text-right",
                              )}
                            >
                              {Icon ? <Icon className="h-5 w-5" /> : null}
                              <SidebarItemLabel
                                title={item.title}
                                titleKey={item.titleKey}
                                badge={item.badge}
                                badgeKey={item.badgeKey}
                                t={t}
                                isRtl={isRtl}
                              />
                            </MenuItem>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
