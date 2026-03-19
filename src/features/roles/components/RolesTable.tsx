"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";
import { BulkManageRolePermissionsDialog } from "@/features/role-permissions/components/BulkManageRolePermissionsDialog";
import { DeleteRoleDialog } from "@/features/roles/components/DeleteRoleDialog";
import { useModal } from "@/components/ui/modal-store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";
import type { Role } from "@/features/roles/types/role";

const DEFAULT_PER_PAGE = 20;
const EMPTY_ROLES: Role[] = [];
const DESCRIPTION_PREVIEW_LENGTH = 90;

type RolesTableProps = {
  scopeCenterId?: string | number | null;
  onEdit?: (_role: Role) => void;
  canManageWrite?: boolean;
};

function getRoleDescription(role: Role): string {
  const direct = role.description;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const translations = role.description_translations;
  if (translations && typeof translations === "object") {
    const english = translations.en;
    if (typeof english === "string" && english.trim()) {
      return english.trim();
    }

    for (const value of Object.values(translations)) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return "";
}

function getDescriptionPreview(description: string): string {
  if (description.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return description;
  }

  return `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}...`;
}

export function RolesTable({
  scopeCenterId = null,
  onEdit,
  canManageWrite = false,
}: RolesTableProps) {
  const { t } = useTranslation();
  const emptyValue = t("pages.roles.fallbacks.noValue");
  const [deletingRole, setDeletingRole] = useState<{
    id: string | number;
    name?: string | null;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { showToast } = useModal();

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useRoles(params, {
    centerId: scopeCenterId,
  });

  const items = data?.items ?? EMPTY_ROLES;
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const isBusy = Boolean(deletingRole);
  const hasActiveFilters = search.trim().length > 0;
  const activeFilterCount = search.trim().length > 0 ? 1 : 0;

  const selectedIds = useMemo(
    () => Object.keys(selectedRoles),
    [selectedRoles],
  );
  const selectedCount = selectedIds.length;
  const selectedRolesList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedRoles[id])
        .filter((role): role is Role => Boolean(role)),
    [selectedIds, selectedRoles],
  );
  const pageRoleIds = useMemo(
    () => items.map((role) => String(role.id)),
    [items],
  );
  const isAllPageSelected =
    pageRoleIds.length > 0 && pageRoleIds.every((id) => selectedRoles[id]);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSelectedRoles({});
    setExpandedDescriptions({});
  }, [page, perPage, query]);

  const toggleRoleSelection = (role: Role) => {
    if (!canManageWrite) return;

    const id = String(role.id);
    setSelectedRoles((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = role;
      }
      return next;
    });
  };

  const toggleSelectPage = () => {
    if (!canManageWrite) return;

    setSelectedRoles((prev) => {
      const next = { ...prev };

      if (isAllPageSelected) {
        pageRoleIds.forEach((id) => {
          delete next[id];
        });
        return next;
      }

      items.forEach((role) => {
        next[String(role.id)] = role;
      });

      return next;
    });
  };

  const clearSelection = () => {
    setSelectedRoles({});
  };

  const toggleDescriptionExpansion = (roleId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  const columnsCount = canManageWrite ? 6 : 5;

  return (
    <div className="space-y-6">
      <ListingCard>
        <ListingFilters
          activeCount={activeFilterCount}
          isFetching={isFetching}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            setSearch("");
            setQuery("");
            setPerPage(DEFAULT_PER_PAGE);
            setPage(1);
            clearSelection();
          }}
          summary={
            <>
              {total === 1
                ? t("pages.roles.table.summary", { count: total })
                : t("pages.roles.table.summaryPlural", { count: total })}
            </>
          }
          gridClassName="grid-cols-1 md:grid-cols-3"
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
              placeholder={t("pages.roles.table.searchPlaceholder")}
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
              aria-label={t("pages.roles.table.clearSearch")}
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
        </ListingFilters>

        {isError ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {t("pages.roles.table.loadFailed")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                {t("pages.roles.table.retry")}
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
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                  {canManageWrite ? (
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectPage}
                        aria-label={t("pages.roles.table.selectAll")}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={isLoadingState || items.length === 0}
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="font-medium">
                    {t("pages.roles.table.headers.name")}
                  </TableHead>
                  <TableHead className="font-medium">
                    {t("pages.roles.table.headers.slug")}
                  </TableHead>
                  <TableHead className="font-medium">
                    {t("pages.roles.table.headers.permissions")}
                  </TableHead>
                  <TableHead className="font-medium">
                    {t("pages.roles.table.headers.description")}
                  </TableHead>
                  <TableHead className="w-10 text-right font-medium">
                    {t("pages.roles.table.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="animate-pulse">
                        {canManageWrite ? (
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                        ) : null}
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-60" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-8 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={columnsCount} className="h-48">
                      <EmptyState
                        title={
                          query
                            ? t("pages.roles.table.empty.noResultsTitle")
                            : t("pages.roles.table.empty.noDataTitle")
                        }
                        description={t(
                          "pages.roles.table.empty.noDataDescription",
                        )}
                        className="border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((role, _index) => {
                    const roleId = String(role.id);
                    const isSelected = Boolean(selectedRoles[roleId]);
                    const permissionsCount = Array.isArray(role.permissions)
                      ? role.permissions.length
                      : 0;
                    const description = getRoleDescription(role);
                    const isDescriptionExpanded = Boolean(
                      expandedDescriptions[roleId],
                    );
                    const hasLongDescription =
                      description.length > DESCRIPTION_PREVIEW_LENGTH;
                    const descriptionText = isDescriptionExpanded
                      ? description
                      : getDescriptionPreview(description);

                    return (
                      <TableRow
                        key={role.id}
                        className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                      >
                        {canManageWrite ? (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRoleSelection(role)}
                              aria-label={t("pages.roles.table.selectRole", {
                                name:
                                  role.name ??
                                  role.slug ??
                                  t(
                                    "pages.roles.table.headers.name",
                                  ).toLowerCase(),
                              })}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </TableCell>
                        ) : null}
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {role.name ?? emptyValue}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {role.slug ?? emptyValue}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {permissionsCount}
                        </TableCell>
                        <TableCell className="max-w-[380px] text-gray-500 dark:text-gray-400">
                          {description ? (
                            <div className="space-y-1">
                              <p className="break-words text-sm leading-5">
                                {descriptionText}
                              </p>
                              {hasLongDescription ? (
                                <button
                                  type="button"
                                  className="text-xs font-medium text-primary hover:underline"
                                  onClick={() =>
                                    toggleDescriptionExpansion(roleId)
                                  }
                                >
                                  {isDescriptionExpanded
                                    ? t(
                                        "pages.roles.table.description.viewLess",
                                      )
                                    : t(
                                        "pages.roles.table.description.viewMore",
                                      )}
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            emptyValue
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === role.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? role.id : null)
                              }
                            >
                              <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                ⋮
                              </DropdownTrigger>
                              <DropdownContent
                                align="end"
                                className={cn(
                                  "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                )}
                              >
                                <button
                                  className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setPermissionsRole(role);
                                  }}
                                >
                                  {canManageWrite
                                    ? t(
                                        "pages.roles.table.actions.managePermissions",
                                      )
                                    : t(
                                        "pages.roles.table.actions.viewPermissions",
                                      )}
                                </button>
                                {canManageWrite && onEdit ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(role);
                                    }}
                                  >
                                    {t("pages.roles.table.actions.edit")}
                                  </button>
                                ) : null}
                                {canManageWrite ? (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeletingRole({
                                        id: role.id,
                                        name: role.name ?? null,
                                      });
                                    }}
                                    disabled={isBusy}
                                  >
                                    {t("pages.roles.table.actions.delete")}
                                  </button>
                                ) : null}
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

        {canManageWrite && selectedCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400">
              {t("pages.roles.table.bulk.selected", { count: selectedCount })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkDialogOpen(true)}
                disabled={isLoadingState}
              >
                {t("pages.roles.table.bulk.managePermissions")}
              </Button>
            </div>
          </div>
        ) : null}

        {!isError && maxPage > 1 ? (
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
        ) : null}
      </ListingCard>

      <Dialog
        open={permissionsRole != null}
        onOpenChange={(open) => {
          if (!open) setPermissionsRole(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl overflow-hidden p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {canManageWrite
                ? t("pages.roles.table.dialogs.syncPermissions")
                : t("pages.roles.table.dialogs.viewPermissionsReadOnly")}
            </DialogTitle>
            <DialogDescription>
              {permissionsRole?.name
                ? t("pages.roles.table.dialogs.updatePermissionsFor", {
                    name: permissionsRole.name,
                  })
                : t("pages.roles.table.dialogs.updatePermissionsGeneric")}
            </DialogDescription>
          </DialogHeader>
          {permissionsRole ? (
            <div className="max-h-[70vh] overflow-y-auto">
              <RolePermissionsForm
                roleId={String(permissionsRole.id)}
                scopeCenterId={scopeCenterId}
                readOnly={!canManageWrite}
                onApplied={({ added, removed }) => {
                  setPermissionsRole(null);
                  setBulkDialogOpen(false);
                  setOpenMenuId(null);
                  clearSelection();
                  showToast(
                    t("pages.roles.table.dialogs.permissionsUpdated", {
                      added,
                      removed,
                    }),
                    "success",
                  );
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <BulkManageRolePermissionsDialog
        open={bulkDialogOpen}
        onOpenChange={(nextOpen) => {
          setBulkDialogOpen(nextOpen);
          if (!nextOpen) {
            clearSelection();
          }
        }}
        scopeCenterId={scopeCenterId}
        roles={selectedRolesList}
        onSuccess={(message) => {
          setPermissionsRole(null);
          setBulkDialogOpen(false);
          setOpenMenuId(null);
          showToast(message, "success");
          clearSelection();
        }}
      />

      <DeleteRoleDialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => {
          if (!open) setDeletingRole(null);
        }}
        scopeCenterId={scopeCenterId}
        role={
          deletingRole
            ? { id: deletingRole.id, name: deletingRole.name ?? null }
            : null
        }
        onSuccess={() => setDeletingRole(null)}
      />
    </div>
  );
}
