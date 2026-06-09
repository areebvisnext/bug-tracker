"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import BugDetailModal from "@/components/bugs/BugDetailModal";
import CreateBugModal from "@/components/bugs/CreateBugModal";
import ActionMenu from "@/components/bugs/ActionMenu";

import { getAccessToken } from "@/lib/auth";
import {
  GetBug,
  GetBugs,
  DeleteBug,
  CreateBug,
  UpdateBug,
  BugResponse,
  GetDevs,
  getCurrentUser,
  GetProjects,
  ProjectResponse,
  UploadBugScreenshot,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { getPriority } from "node:os";

type ViewMode = "list" | "cards";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

const ROWS_OPTIONS = [5, 10, 20, 50];

export default function BugsPage() {
  const router = useRouter();

  const [bugs, setBugs] = useState<BugResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [devs, setDevs] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [search, setSearch] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugResponse | null>(null);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getAccessToken();
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const userData = await getCurrentUser(token);
        setCurrentUser(userData as UserProfile);

        const [bugsData, projectsData, devsData] = await Promise.all([
          GetBugs(token),
          GetProjects(token),
          GetDevs(token),
        ]);

        setBugs(bugsData);
        setProjects(projectsData);
        setDevs(devsData);
      } catch {
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const assignedToMap = useMemo(() => {
    const map: Record<string, string> = {};

    if (!devs) {
      return {};
    }
    for (const dev of devs) {
      map[dev.id] = dev.full_name;
    }

    return map;
  }, [devs]);

  const filteredBugs = useMemo(() => {
    const query = search.toLowerCase();

    return bugs.filter((bug) => {
      const matchesSearch =
        bug.title.toLowerCase().includes(query) ||
        (bug.description?.toLowerCase().includes(query) ?? false) ||
        assignedToMap[bug.assigned_to]?.toLowerCase().includes(query);

      const matchesAssigned =
        !assignedFilter || bug.assigned_to === assignedFilter;

      const matchesProject =
        !projectFilter || String(bug.project_id) === projectFilter;

      const matchesStatus = !statusFilter || bug.status === statusFilter;
      const matchesType = !typeFilter || bug.type === typeFilter;
      const matchesPriority =
        !priorityFilter || bug.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesAssigned &&
        matchesProject &&
        matchesStatus &&
        matchesType &&
        matchesPriority
      );
    });
  }, [
    bugs,
    search,
    assignedFilter,
    projectFilter,
    statusFilter,
    typeFilter,
    priorityFilter,
    assignedToMap,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    assignedFilter,
    projectFilter,
    statusFilter,
    typeFilter,
    priorityFilter,
    rowsPerPage,
  ]);

  const totalPages = Math.ceil(filteredBugs.length / rowsPerPage);
  const paginatedBugs = filteredBugs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  function getPriorityStyle(priority: string): {
    dot: string;
    badge: string;
    text: string;
  } {
    if (priority === "low") {
      return {
        dot: "bg-green-500",
        badge: "bg-green-50 border border-green-200",
        text: "text-green-600",
      };
    }
    if (priority === "medium") {
      return {
        dot: "bg-yellow-500",
        badge: "bg-yellow-50 border border-yellow-200",
        text: "text-yellow-600",
      };
    }
    return {
      dot: "bg-red-500",
      badge: "bg-red-50 border border-red-200",
      text: "text-red-600",
    };
  }

  function getStatusStyle(status: string): {
    dot: string;
    badge: string;
    text: string;
  } {
    switch (status) {
      case "new":
        return {
          dot: "bg-blue-500",
          badge: "bg-blue-50 border border-blue-200",
          text: "text-blue-600",
        };

      case "started":
        return {
          dot: "bg-orange-400",
          badge: "bg-orange-50 border border-orange-200",
          text: "text-orange-500",
        };

      case "completed":
        return {
          dot: "bg-green-500",
          badge: "bg-green-50 border border-green-200",
          text: "text-green-600",
        };

      case "resolved":
        return {
          dot: "bg-slate-400",
          badge: "bg-slate-50 border border-slate-200",
          text: "text-slate-600",
        };

      case "in progress":
        return {
          dot: "bg-blue-400",
          badge: "bg-blue-50 border border-blue-200",
          text: "text-blue-500",
        };

      case "closed":
        return {
          dot: "bg-slate-400",
          badge: "bg-slate-50 border border-slate-200",
          text: "text-slate-600",
        };

      default:
        return {
          dot: "bg-gray-400",
          badge: "bg-gray-50 border border-gray-200",
          text: "text-gray-600",
        };
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  const canEdit = currentUser?.role === "QA";
  const canEditStatus =
    currentUser?.role === "QA" || currentUser?.role === "Developer";

  function getStatusOptions(type: string): string[] {
    return type === "feature"
      ? ["new", "started", "completed"]
      : ["new", "started", "resolved"];
  }

  async function handleDeleteBug(bugId: number) {
    if (canEdit) {
      const token = await getAccessToken();
      await DeleteBug(bugId, token);

      setBugs((c) => c.filter((b) => b.id !== bugId));
      setOpenMenuId(null);
    }
  }

  async function handleChangeStatus(bug: BugResponse, newStatus: string) {
    if (canEditStatus) {
      const token = await getAccessToken();

      const payload: any = {};
      payload.status = newStatus;

      await UpdateBug(bug.id, payload, token);
      const updated = { ...bug, status: newStatus as BugResponse["status"] };
      handleUpdateBug(updated);
      setOpenMenuId(null);
    }
  }

  async function handleCreateBug(
    payload: {
      title: string;
      description?: string | null;
      type: "bug" | "feature";
      status: "new" | "started" | "completed" | "resolved";
      priority: "low" | "medium" | "high";
      deadline?: string | null;
      project_id: number;
      assigned_to: string;
    },
    screenshotFile?: File | null,
  ) {
    const token = getAccessToken();
    if (!token) return;

    const created = await CreateBug(payload, token);

    if (screenshotFile) {
      try {
        await UploadBugScreenshot(created.id, screenshotFile, token);

        const refreshed = await GetBug(created.id, token);
        setBugs((c) => [refreshed, ...c]);
        return;
      } catch {}
    }
    setBugs((c) => [created, ...c]);
  }

  function handleUpdateBug(updatedBug: BugResponse) {
    setBugs((c) => c.map((b) => (b.id === updatedBug.id ? updatedBug : b)));
    setSelectedBug(updatedBug);
  }

  function FilterSelect({
    value,
    onChange,
    label,
    children,
  }: {
    value: string;
    onChange: (v: string) => void;
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
        <span className="whitespace-nowrap text-slate-400 font-medium">
          {label}
        </span>

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-slate-700 outline-none cursor-pointer text-sm font-medium"
        >
          {children}
        </select>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7]">
        <AppHeader userName={currentUser?.full_name ?? "User"} />

        <div className="mx-auto max-w-7xl px-6 py-10 text-slate-500 text-sm">
          Loading bugs...
        </div>
      </div>
    );
  }

  const startEntry =
    filteredBugs.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, filteredBugs.length);

  return (
    <>
      <BugDetailModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        bug={selectedBug}
        projects={projects}
        devs={devs}
        currentUserRole={currentUser?.role ?? null}
        currentUserId={currentUser?.id ?? null}
        onUpdate={handleUpdateBug}
      />

      <CreateBugModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBug}
        projects={projects}
        devs={devs}
      />

      <div className="min-h-screen bg-[#f4f5f7] font-sans">
        <AppHeader userName={currentUser?.full_name ?? "User"} />

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              All bugs listing
            </h1>

            {currentUser?.role === "QA" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <span className="text-base leading-none">+</span> New Task bug
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm min-w-[180px]">
              <svg
                className="h-4 w-4 text-slate-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <FilterSelect
              value={assignedFilter}
              onChange={setAssignedFilter}
              label="Assigned To"
            >
              <option value="">All</option>
              {devs &&
                devs.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.full_name}
                  </option>
                ))}
            </FilterSelect>

            <FilterSelect
              value={projectFilter}
              onChange={setProjectFilter}
              label="Project"
            >
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              label="Status"
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
              <option value="resolved">Resolved</option>
            </FilterSelect>

            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              label="Type"
            >
              <option value="">All</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
            </FilterSelect>

            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              label="Priority"
            >
              <option value="">All</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </FilterSelect>

            <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode("cards")}
                title="Card view"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
              </button>

              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <rect x="1" y="2" width="14" height="2" rx="1" />
                  <rect x="1" y="7" width="14" height="2" rx="1" />
                  <rect x="1" y="12" width="14" height="2" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {viewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Bug Details
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Priority
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Due Date
                      </th>

                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assigned To
                      </th>

                      {canEditStatus && (
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedBugs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-sm text-slate-400"
                        >
                          No bugs found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedBugs.map((bug) => {
                        const s = getStatusStyle(bug.status);
                        const p = getPriorityStyle(bug.priority);
                        return (
                          <tr
                            key={bug.id}
                            className="group cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => {
                              setSelectedBug(bug);
                              setShowDetailModal(true);
                            }}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`}
                                />
                                <span className="font-medium text-slate-800">
                                  {bug.title}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${s.badge} ${s.text}`}
                              >
                                {bug.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${p.badge} ${p.text}`}
                              >
                                {bug.priority}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <svg
                                  className="h-4 w-4 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    strokeWidth={1.5}
                                  />
                                  <path
                                    d="M16 2v4M8 2v4M3 10h18"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="text-sm">
                                  {formatDate(bug.deadline)}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white shrink-0">
                                  {(assignedToMap[bug.assigned_to] ??
                                    "?")[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-700">
                                  {assignedToMap[bug.assigned_to] ??
                                    bug.assigned_to}
                                </span>
                              </div>
                            </td>

                            {canEditStatus && (
                              <td className="px-5 py-4">
                                <ActionMenu
                                  bug={bug}
                                  canEdit={canEdit}
                                  canEditStatus={canEditStatus}
                                  openMenuId={openMenuId}
                                  menuRef={menuRef}
                                  getStatusOptions={getStatusOptions}
                                  setOpenMenuId={setOpenMenuId}
                                  getStatusStyle={getStatusStyle}
                                  handleChangeStatus={handleChangeStatus}
                                  handleDeleteBug={handleDeleteBug}
                                />
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                {paginatedBugs.length === 0 ? (
                  <div className="py-16 text-center text-sm text-slate-400">
                    No bugs found matching your filters.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedBugs.map((bug) => {
                      const s = getStatusStyle(bug.status);
                      return (
                        <div
                          key={bug.id}
                          className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${s.badge} ${s.text}`}
                            >
                              {bug.status}
                            </span>

                            <ActionMenu
                              bug={bug}
                              canEdit={canEdit}
                              canEditStatus={canEditStatus}
                              openMenuId={openMenuId}
                              menuRef={menuRef}
                              getStatusOptions={getStatusOptions}
                              setOpenMenuId={setOpenMenuId}
                              getStatusStyle={getStatusStyle}
                              handleChangeStatus={handleChangeStatus}
                              handleDeleteBug={handleDeleteBug}
                            />
                          </div>

                          <h3 className="mt-4 text-base font-semibold text-slate-900 leading-snug">
                            {bug.title}
                          </h3>

                          <div className="mt-4 space-y-2.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-blue-600">
                                Due Date
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <svg
                                  className="h-4 w-4 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    strokeWidth={1.5}
                                  />
                                  <path
                                    d="M16 2v4M8 2v4M3 10h18"
                                    strokeWidth={1.5}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                {formatDate(bug.deadline)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-blue-600">
                                Assigned To
                              </span>

                              <div className="flex items-center gap-2 text-slate-600">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white">
                                  {(assignedToMap[bug.assigned_to] ??
                                    "?")[0]?.toUpperCase()}
                                </div>

                                <span>
                                  {assignedToMap[bug.assigned_to] ??
                                    bug.assigned_to}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBug(bug);
                              setShowDetailModal(true);
                            }}
                            className="mt-5 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
              <span className="text-sm text-slate-500">
                Showing {startEntry} to {endEntry} of {filteredBugs.length}{" "}
                entries
              </span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none"
                  >
                    {ROWS_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-sm text-slate-500">
                  {currentPage}–{totalPages || 1} of {totalPages || 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
