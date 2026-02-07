"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { setTenantState } from "@/lib/tenant-store";
import { formatDateTime } from "@/lib/format-date-time";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import { useAdminUsers } from "@/features/admin-users/hooks/use-admin-users";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_ROLE_VALUE = "all";

type StatusVariant = "success" | "warning" | "secondary" | "error" | "default";
type AdminUserStatus = string | number | null | undefined;

const statusConfig: Record<
  string,
  { variant: StatusVariant; label: string; key: string }
> = {
  active: { variant: "success", label: "Active", key: "active" },
  inactive: { variant: "warning", label: "Inactive", key: "inactive" },
  banned: { variant: "error", label: "Banned", key: "banned" },
};

const statusValueMap: Record<string, string> = {
  "0": "inactive",
  "1": "active",
  "2": "banned",
  inactive: "inactive",
  active: "active",
  banned: "banned",
};

function resolveStatus(status: AdminUserStatus, statusLabel?: string | null) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  const normalized = statusValueMap[raw] ?? raw;
  const config = statusConfig[normalized] ?? {
    variant: "default" as const,
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Unknown",
    key: normalized || "unknown",
  };

  if (typeof statusLabel === "string" && statusLabel.trim()) {
    return { ...config, label: statusLabel.trim() };
  }

  return config;
}

function resolveRoles(user: AdminUser): string[] {
  if (!Array.isArray(user.roles) || user.roles.length === 0) {
    if (
      Array.isArray(user.roles_with_permissions) &&
      user.roles_with_permissions.length > 0
    ) {
      return user.roles_with_permissions.map((role) =>
        toRoleDisplayName(role.slug),
      );
    }
    return [];
  }

  return user.roles.map((role) => {
    if (typeof role === "string") return toRoleDisplayName(role);
    return role.name ?? toRoleDisplayName(role.slug) ?? "Role";
  });
}

function toRoleDisplayName(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Role";

  return raw
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const StatusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75h7.5a2.25 2.25 0 002.25-2.25v-1.125a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 15.375V16.5a2.25 2.25 0 002.25 2.25zM8.25 10.875h7.5a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 7.5v1.125a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

const RoleIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.75a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zm6.75 10.5a6.75 6.75 0 00-13.5 0"
    />
  </svg>
);

type AdminUsersTableProps = {
  onEdit?: (_user: AdminUser) => void;
  onManageRoles?: (_user: AdminUser) => void;
  onAssignCenters?: (_user: AdminUser) => void;
  onToggleStatus?: (_user: AdminUser) => void;
  onDelete?: (_user: AdminUser) => void;
  onBulkAssignRoles?: (_users: AdminUser[]) => void;
  onBulkAssignCenters?: (_users: AdminUser[]) => void;
  onBulkChangeStatus?: (_users: AdminUser[]) => void;
};

export function AdminUsersTable({
  onEdit,
  onManageRoles,
  onAssignCenters,
  onToggleStatus,
  onDelete,
  onBulkAssignRoles,
  onBulkAssignCenters,
  onBulkChangeStatus,
}: AdminUsersTableProps) {
  const { centerId, centerSlug } = useTenant();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLE_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, AdminUser>>(
    {},
  );

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: centerId ?? undefined,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
      role_id: roleFilter === ALL_ROLE_VALUE ? undefined : roleFilter,
    }),
    [centerId, page, perPage, query, roleFilter, statusFilter],
  );

  const { data, isLoading, isError, isFetching } = useAdminUsers(params);
  const { data: rolesData, isLoading: isRolesLoading } = useRoles({
    page: 1,
    per_page: 20,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== ALL_STATUS_VALUE ||
    roleFilter !== ALL_ROLE_VALUE ||
    (!centerSlug && centerId != null);
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (roleFilter !== ALL_ROLE_VALUE ? 1 : 0) +
    (!centerSlug && centerId != null ? 1 : 0);
  const selectedIds = useMemo(
    () => Object.keys(selectedUsers),
    [selectedUsers],
  );
  const selectedCount = selectedIds.length;
  const selectedUsersList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedUsers[id])
        .filter((user): user is AdminUser => Boolean(user)),
    [selectedIds, selectedUsers],
  );
  const pageUserIds = useMemo(
    () => items.map((user) => String(user.id)),
    [items],
  );
  const isAllPageSelected =
    pageUserIds.length > 0 && pageUserIds.every((id) => selectedUsers[id]);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [centerId]);

  useEffect(() => {
    setSelectedUsers({});
  }, [centerId, page, perPage, query, roleFilter, statusFilter]);

  const roleOptions = useMemo(() => rolesData?.items ?? [], [rolesData]);

  const toggleUserSelection = (user: AdminUser) => {
    const userId = String(user.id);
    setSelectedUsers((prev) => {
      if (prev[userId]) {
        const { [userId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [userId]: user };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedUsers((prev) => {
        if (pageUserIds.length === 0) return prev;
        const next = { ...prev };
        pageUserIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedUsers((prev) => {
      const next = { ...prev };
      items.forEach((user) => {
        next[String(user.id)] = user;
      });
      return next;
    });
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearch("");
          setQuery("");
          setStatusFilter(ALL_STATUS_VALUE);
          setRoleFilter(ALL_ROLE_VALUE);
          if (!centerSlug) {
            setTenantState({ centerId: null, centerName: null });
          }
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "admin user" : "admin users"}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-4"
      >
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setPage(1);
              if (query) setQuery("");
            }}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
              search.trim().length > 0
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            aria-label="Clear search"
            tabIndex={search.trim().length > 0 ? 0 : -1}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <CenterPicker
          className="w-full min-w-0"
          hideWhenCenterScoped={false}
          selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
        >
          <SelectTrigger
            className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            icon={<StatusIcon />}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>Status</SelectItem>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="0">Inactive</SelectItem>
            <SelectItem value="2">Banned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setPage(1);
            setRoleFilter(value);
          }}
          disabled={isRolesLoading}
        >
          <SelectTrigger
            className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            icon={<RoleIcon />}
          >
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ROLE_VALUE}>Role</SelectItem>
            {roleOptions.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name ?? role.slug ?? `Role #${role.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load admin users. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            isFetching && !isLoading ? "opacity-60" : "opacity-100",
          )}
        >
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all admin users on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">User</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                <TableHead className="font-medium">Roles</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Last Active</TableHead>
                <TableHead className="w-10 text-right font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-4 w-28" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48">
                    <EmptyState
                      title={
                        query ? "No admin users found" : "No admin users yet"
                      }
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Create an admin user to get started"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((user, index) => {
                  const status = resolveStatus(
                    user.status_key ?? user.status,
                    user.status_label,
                  );
                  const roles = resolveRoles(user);
                  const roleCount = roles.length;
                  const primaryRole = roles[0];
                  const moreRoles = roleCount > 1 ? roleCount - 1 : 0;
                  const lastActiveValue = user.last_active ?? null;
                  const lastActiveLabel = (() => {
                    if (!lastActiveValue) return "—";
                    const formatted = formatDateTime(lastActiveValue);
                    return formatted !== "—"
                      ? formatted
                      : String(lastActiveValue);
                  })();

                  const shouldOpenUp = index >= Math.max(0, items.length - 2);

                  return (
                    <TableRow
                      key={user.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(selectedUsers[String(user.id)])}
                          onChange={() => toggleUserSelection(user)}
                          aria-label={`Select ${user.name ?? `user ${user.id}`}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(
                              user.name ??
                                user.email ??
                                `Admin ${user.id ?? ""}`,
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.name ?? "—"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email ?? "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {user.center?.name ??
                          (user.center_id != null
                            ? `Center #${user.center_id}`
                            : "—")}
                      </TableCell>
                      <TableCell>
                        {roleCount === 0 ? (
                          "—"
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <span>{primaryRole}</span>
                            {moreRoles > 0 ? (
                              <span className="group relative">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 transition-colors group-hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:group-hover:bg-gray-700">
                                  +{moreRoles}
                                </span>
                                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[260px] -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 opacity-0 shadow-xl transition-all duration-150 group-hover:translate-y-0.5 group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                  <span className="block whitespace-normal">
                                    {roles.join(", ")}
                                  </span>
                                </span>
                              </span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.status != null || user.status_label ? (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {lastActiveLabel}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === user.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? user.id : null)
                            }
                          >
                            <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                shouldOpenUp && "bottom-full mb-2 mt-0",
                              )}
                            >
                              <button
                                className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEdit?.(user);
                                }}
                              >
                                Edit profile
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onManageRoles?.(user);
                                }}
                              >
                                Manage roles
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onAssignCenters?.(user);
                                }}
                              >
                                Assign centers
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onToggleStatus?.(user);
                                }}
                              >
                                {status.key === "active"
                                  ? "Suspend"
                                  : "Activate"}
                              </button>
                              <button
                                className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDelete?.(user);
                                }}
                              >
                                Delete
                              </button>
                            </DropdownContent>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAssignRoles?.(selectedUsersList)}
              disabled={isLoadingState}
            >
              Assign Roles
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAssignCenters?.(selectedUsersList)}
              disabled={isLoadingState}
            >
              Assign Centers
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkChangeStatus?.(selectedUsersList)}
              disabled={isLoadingState}
            >
              Change Status
            </Button>
          </div>
        </div>
      )}

      {!isError && maxPage > 1 && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <PaginationControls
            page={page}
            lastPage={maxPage}
            isFetching={isFetching}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            size="sm"
          />
        </div>
      )}
    </ListingCard>
  );
}
