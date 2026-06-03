"use client";

import { GetProjectMembers } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface EditProjectModalProps {
  open: boolean;
  onClose: () => void;
  project: {
    id: number;
    name: string;
    description: string | null;
    logo?: string | null;
  } | null;
  onSubmit: (data: {
    name: string;
    description: string;
    logo: File | null;
    selectedDevs: string[];
    selectedQAs: string[];
  }) => Promise<void>;
  devs: User[];
  qas: User[];
}

export default function EditProject({
  open,
  onClose,
  project,
  onSubmit,
  devs,
  qas,
}: EditProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [selectedDevs, setSelectedDevs] = useState<Set<string>>(new Set());
  const [selectedQAs, setSelectedQAs] = useState<Set<string>>(new Set());
  const [previousMembers, setPreviousMember] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [showQADropdown, setShowQADropdown] = useState(false);
  const devDropdownRef = useRef<HTMLDivElement>(null);
  const qaDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !project) return;

    const load = async () => {
      setSelectedDevs(new Set());
      setSelectedQAs(new Set());
      let token = await getAccessToken();
      let members = await GetProjectMembers(token, project.id);
      const memberIdSet = new Set(members.map((member) => member.user_id));
      setPreviousMember(memberIdSet);
      const devSet: Set<string> = new Set();
      devs.forEach((dev) => {
        if (memberIdSet.has(dev.id)) {
          devSet.add(dev.id);
        }
      });
      setSelectedDevs(devSet);
      const qaSet: Set<string> = new Set();
      qas.forEach((qa) => {
        if (memberIdSet.has(qa.id)) {
          qaSet.add(qa.id);
        }
      });
      setSelectedQAs(qaSet);
    };
    load();
    setName(project.name);
    setDescription(project.description || "");
    setLogo(null);
    setPreview(project.logo || "");
    setShowDevDropdown(false);
    setShowQADropdown(false);

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, project]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        devDropdownRef.current &&
        !devDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDevDropdown(false);
      }
      if (
        qaDropdownRef.current &&
        !qaDropdownRef.current.contains(event.target as Node)
      ) {
        setShowQADropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!open || !project) return null;

  async function handleSubmit() {
    if (!name.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      setLoading(true);
      const newSet = new Set(selectedDevs);
      selectedDevs.forEach((dev) => {
        if (previousMembers.has(dev)) {
          newSet.delete(dev);
        }
      });
      setSelectedDevs(newSet);

      const newSetQA = new Set(selectedQAs);
      selectedQAs.forEach((qa) => {
        if (previousMembers.has(qa)) {
          newSetQA.delete(qa);
        }
      });
      setSelectedQAs(newSetQA);

      await onSubmit({
        name,
        description,
        logo,
        selectedDevs: Array.from(selectedDevs),
        selectedQAs: Array.from(selectedQAs),
      });

      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to update project");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  function toggleDev(devId: string) {
    const newSet = new Set(selectedDevs);
    if (newSet.has(devId)) {
      newSet.delete(devId);
    } else {
      newSet.add(devId);
    }
    setSelectedDevs(newSet);
  }

  function toggleQA(qaId: string) {
    const newSet = new Set(selectedQAs);
    if (newSet.has(qaId)) {
      newSet.delete(qaId);
    } else {
      newSet.add(qaId);
    }
    setSelectedQAs(newSet);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[720px] max-h-[90vh] overflow-y-auto rounded-lg bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Project</h2>

          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-[1fr_150px] gap-8">
          {/* Left */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Project name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                className="h-10 w-full rounded border border-gray-200 px-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Short details
              </label>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter details here"
                className="w-full resize-none rounded border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Developers Multi-select */}
            <div ref={devDropdownRef} className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Developers
              </label>
              <button
                type="button"
                onClick={() => setShowDevDropdown(!showDevDropdown)}
                className="w-full h-10 rounded border border-gray-200 px-3 text-sm text-left outline-none focus:border-blue-500 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {selectedDevs.size > 0
                    ? `${selectedDevs.size} developer(s) selected`
                    : "Select developers"}
                </span>
                <span
                  className={`transition-transform ${
                    showDevDropdown ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {showDevDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-gray-200 rounded bg-white shadow-lg z-20 max-h-56 overflow-y-auto">
                  {devs && devs.length > 0 ? (
                    devs.map((dev) => (
                      <label
                        key={dev.id}
                        className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDevs.has(dev.id)}
                          onChange={() => toggleDev(dev.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {dev.full_name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {dev.email}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No developers available
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* QAs Multi-select */}
            <div ref={qaDropdownRef} className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select QAs
              </label>
              <button
                type="button"
                onClick={() => setShowQADropdown(!showQADropdown)}
                className="w-full h-10 rounded border border-gray-200 px-3 text-sm text-left outline-none focus:border-blue-500 flex items-center justify-between bg-white hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {selectedQAs.size > 0
                    ? `${selectedQAs.size} QA(s) selected`
                    : "Select QAs"}
                </span>
                <span
                  className={`transition-transform ${
                    showQADropdown ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {showQADropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-gray-200 rounded bg-white shadow-lg z-20 max-h-56 overflow-y-auto">
                  {qas && qas.length > 0 ? (
                    qas.map((qa) => (
                      <label
                        key={qa.id}
                        className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQAs.has(qa.id)}
                          onChange={() => toggleQA(qa.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {qa.full_name}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {qa.email}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No QAs available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-transparent">
              Upload
            </label>

            <label className="flex h-[140px] w-[140px] cursor-pointer flex-col items-center justify-center rounded border border-dashed border-gray-400 text-gray-500 hover:bg-gray-50">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-full w-full rounded object-cover"
                />
              ) : (
                <>
                  Image
                  <span className="mt-3 text-sm">Change logo</span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-10 w-32 rounded bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update"}
          </button>

          <button
            onClick={onClose}
            className="h-10 w-32 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
