"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BugPayload,
  BugResponse,
  GetProjectMembers,
  ProjectResponse,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

function getStatusOptionsForType(type: "bug" | "feature") {
  if (type === "feature") {
    return ["new", "started", "completed"] as const;
  }
  return ["new", "started", "resolved"] as const;
}

interface CreateBugModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    payload: BugPayload,
    screenshotFile?: File | null,
  ) => Promise<void>;
  projects: ProjectResponse[];
  devs: { id: string; full_name: string; email: string }[];
}

export default function CreateBugModal({
  open,
  onClose,
  onSubmit,
  projects,
  devs,
}: CreateBugModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bugType, setBugType] = useState<"bug" | "feature">("bug");
  const [status, setStatus] = useState<BugResponse["status"]>("new");
  const [deadline, setDeadline] = useState("");

  const [assignedTo, setAssignedTo] = useState<string>(devs?.[0]?.id ?? "");
  const [projectId, setProjectId] = useState<number>(projects?.[0]?.id ?? 0);
  const [projectMembers, setProjectMembers] = useState<{ user_id: string }[]>(
    [],
  );
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const statusOptions = useMemo(() => {
    return getStatusOptionsForType(bugType);
  }, [bugType]);

  useEffect(() => {
    if (!projectId) return;
    const token = getAccessToken();
    GetProjectMembers(token, projectId).then((members) => {
      setProjectMembers(members);
      const validDevs = devs.filter((dev) =>
        members.some((m) => m.user_id === dev.id),
      );
      setAssignedTo(validDevs?.[0]?.id ?? "");
    });
  }, [projectId]);

  const filteredDevs = useMemo(() => {
    if (!projectMembers.length) return devs;
    return devs.filter((dev) =>
      projectMembers.some((m) => m.user_id === dev.id),
    );
  }, [devs, projectMembers]);

  useEffect(() => {
    if (!open) return;

    setTitle("");
    setDescription("");
    setBugType("bug");
    setStatus("new");
    setDeadline("");
    setProjectId(projects?.[0]?.id ?? 0);
    setAssignedTo(devs?.[0]?.id ?? "");
    setScreenshotFile(null);
  }, [open, projects, devs]);

  if (!open) return null;

  async function handleSubmit() {
    if (!title.trim() || !projectId || !assignedTo) {
      alert("Please fill title, project and assignee.");
      return;
    }

    try {
      setLoading(true);

      await onSubmit(
        {
          title,
          description: description || null,
          type: bugType,
          status,
          deadline: deadline || null,
          project_id: projectId,
          assigned_to: assignedTo,
        },
        screenshotFile,
      );
      onClose();
    } catch (error) {
      console.error("Create bug failed", error);
      alert("Failed to create bug");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-4">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Create new bug
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Add new bug
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Assign to
              </label>

              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              >
                {filteredDevs &&
                  filteredDevs.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.full_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Add due date
              </label>

              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Project
              </label>

              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name.charAt(0).toUpperCase() +
                      project.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Type
              </label>

              <select
                value={bugType}
                onChange={(e) => {
                  const nextType = e.target.value as "bug" | "feature";
                  setBugType(nextType);
                  setStatus("new");
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as BugResponse["status"])
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title here"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">
                Bug details
              </label>
              <span className="text-xs text-slate-400">Add here</span>
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Screenshot
            </label>

            <label className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500 transition hover:border-slate-300 hover:bg-slate-100">
              <input
                type="file"
                accept="image/png,image/gif"
                className="sr-only"
                onChange={(event) =>
                  setScreenshotFile(event.target.files?.[0] ?? null)
                }
              />

              <span className="text-2xl">📎</span>

              <div>
                <p className="font-semibold text-slate-900">Add image</p>
                <p className="text-xs text-slate-500">Drop file or browse</p>
              </div>

              {screenshotFile && (
                <p className="text-xs text-slate-600">{screenshotFile.name}</p>
              )}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-10 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
