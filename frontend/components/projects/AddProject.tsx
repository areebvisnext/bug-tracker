"use client";

import { useEffect, useState } from "react";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    logo: File | null;
  }) => Promise<void>;
}

export default function AddProject({
  open,
  onClose,
  onSubmit,
}: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    if (!name.trim()) {
      alert("Project name is required");
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        name,
        description,
        logo,
      });

      setName("");
      setDescription("");
      setLogo(null);
      setPreview("");

      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to create project");
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[720px] rounded-lg bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add new Project</h2>

          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            Cross
          </button>
        </div>

        <div className="grid grid-cols-[1fr_150px] gap-8">
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
          </div>

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
                  <span className="mt-3 text-sm">Upload logo</span>
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

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="h-10 w-32 rounded bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
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
