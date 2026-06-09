"use client";

import { useEffect, useMemo, useState } from "react";

import { getAccessToken } from "@/lib/auth";
import {
  BugResponse,
  GetBug,
  UploadBugScreenshot,
  UpdateBug,
  ProjectResponse,
  GetProjectMembers,
} from "@/lib/api";

type UserSummary = {
  id: string;
  full_name: string;
};

interface BugDetailModalProps {
  open: boolean;
  onClose: () => void;
  bug: BugResponse | null;
  projects: ProjectResponse[];
  devs: UserSummary[];
  currentUserRole: string | null;
  currentUserId: string | null;
  onUpdate: (bug: BugResponse) => void;
}

const statusLabels = {
  new: "New",
  started: "In Progress",
  completed: "Completed",
  resolved: "Resolved",
};

const statusClasses: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  started: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  resolved: "bg-slate-100 text-slate-700",
};

function getStatusOptionsForType(type: "bug" | "feature") {
  if (type === "feature") {
    return ["new", "started", "completed"] as const;
  }
  return ["new", "started", "resolved"] as const;
}

function formatDateForInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
function formatReadableDate(value: string | null) {
  if (!value) return "-";
  const parts = value.split("-");
  if (parts.length !== 3) return "-";
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "-";
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BugDetailModal({
  open,
  onClose,
  bug,
  projects,
  devs,
  currentUserRole,
  currentUserId,
  onUpdate,
}: BugDetailModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bugType, setBugType] = useState<BugResponse["type"]>("bug");
  const [status, setStatus] = useState<BugResponse["status"]>("new");
  const [priority, setPriority] = useState<BugResponse["priority"]>("medium");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [projectMembers, setProjectMembers] = useState<{ user_id: string }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);

  const isQA = currentUserRole === "QA" && bug?.created_by === currentUserId;
  const isDeveloper =
    currentUserRole === "Developer" && bug?.assigned_to === currentUserId;
  const isManager = currentUserRole === "Manager";
  const canEdit = isQA;
  const canChangeStatus = isQA || isDeveloper;
  const canEditPriority = isQA || isManager;

  const statusOptions = useMemo(() => {
    return getStatusOptionsForType(bugType);
  }, [bugType]);

  const priorityOptions = ["low", "medium", "high"];

  useEffect(() => {
    if (!open || !bug) return;

    setTitle(bug.title);
    setDescription(bug.description ?? "");
    setBugType(bug.type);
    setStatus(bug.status);
    setPriority(bug.priority);
    setDeadline(formatDateForInput(bug.deadline));
    setAssignedTo(bug.assigned_to);
    setScreenshotUrl(bug.screenshot ?? null);
    setScreenshotFile(null);
    setSaving(false);
  }, [open, bug]);

  useEffect(() => {
    if (!open || !bug) return;
    const token = getAccessToken();
    GetProjectMembers(token, bug.project_id).then((members) => {
      setProjectMembers(members);
    });
  }, [open, bug]);

  const filteredDevs = useMemo(() => {
    if (!projectMembers.length) return devs;
    return devs.filter((dev) =>
      projectMembers.some((m) => m.user_id === dev.id),
    );
  }, [devs, projectMembers]);

  const projectName =
    projects.find((p) => p.id === bug?.project_id)?.name ?? "Unknown";

  if (!open || !bug) return null;

  const assignedDev = devs.find((item) => item.id === bug.assigned_to);

  function handleTypeChange(newType: BugResponse["type"]) {
    setBugType(newType);
    setStatus("new");
  }

  async function handleSave() {
    if (!bug) return;
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      setSaving(true);
      const payload: any = {};

      if (canEdit) {
        payload.title = title;
        payload.description = description || null;
        payload.type = bugType;
        payload.deadline = deadline || null;
        payload.assigned_to = assignedTo;
      }

      if (canChangeStatus && status !== bug.status) {
        payload.status = status;
      }

      if (canEditPriority) {
        payload.priority = priority;
      }

      await UpdateBug(bug.id, payload, accessToken);

      if (screenshotFile) {
        await UploadBugScreenshot(bug.id, screenshotFile, accessToken);
      }

      const refreshed = await GetBug(bug.id, accessToken);
      onUpdate(refreshed);
      onClose();
    } catch (error) {
      console.error("Unable to save bug details", error);
      alert("Failed to save bug details.");
    } finally {
      setSaving(false);
    }
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotUrl(URL.createObjectURL(file));
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="border-b border-slate-200 px-8 py-5 shrink-0 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Bug Details
            </p>

            <h2 className="mt-2 text-lg font-semibold text-slate-900 line-clamp-2">
              {bug.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
            >
              {statusLabels[status]}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {bugType === "bug" ? "Bug" : "Feature"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Assigned to
              </label>

              {canEdit ? (
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  {filteredDevs.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.full_name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {assignedDev?.full_name ?? "Unknown"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Due date
              </label>

              {canEdit ? (
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {formatReadableDate(deadline || null)}
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Title
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Project
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {projectName.charAt(0).toUpperCase() + projectName.slice(1)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Type
              </label>

              {canEdit ? (
                <select
                  value={bugType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as BugResponse["type"])
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                </select>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {bugType === "bug" ? "Bug" : "Feature"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Status
              </label>

              {canChangeStatus ? (
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as BugResponse["status"])
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {statusLabels[opt]}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {statusLabels[status]}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Priority
              </label>

              {canEditPriority ? (
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as BugResponse["priority"])
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {priority}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              rows={3}
              placeholder="Add details here"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Screenshot
            </label>

            <label className="relative block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center transition hover:border-slate-300 hover:bg-slate-100">
              <input
                type="file"
                accept="image/png,image/gif"
                disabled={!canEdit}
                className="sr-only"
                onChange={(event) =>
                  handleFileSelect(event.target.files?.[0] ?? null)
                }
              />

              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Bug screenshot"
                  className="mx-auto max-h-32 rounded-2xl object-contain"
                />
              ) : (
                <div className="space-y-2">
                  <div className="text-xl">🖼️</div>
                  <p className="text-xs font-semibold text-slate-900">
                    Add image
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-8 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {(canEdit || canChangeStatus || canEditPriority) && (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="h-10 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
