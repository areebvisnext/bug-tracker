import { BugResponse } from "@/lib/api";

type ActionMenuProps = {
  bug: BugResponse;
  canEditStatus: boolean;
  canEdit: boolean;
  openMenuId: number | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  getStatusOptions: (type: string) => string[];
  setOpenMenuId: (id: number | null) => void;
  getStatusStyle: (status: string) => {
    dot: string;
    badge: string;
    text: string;
  };
  handleChangeStatus: (bug: BugResponse, newStatus: string) => void;
  handleDeleteBug: (id: number) => void;
};

export default function ActionMenu({
  bug,
  canEditStatus,
  canEdit,
  openMenuId,
  menuRef,
  getStatusOptions,
  setOpenMenuId,
  getStatusStyle,
  handleChangeStatus,
  handleDeleteBug,
}: ActionMenuProps) {
  if (!canEditStatus) return null;

  const statusOptions = getStatusOptions(bug.type);
  const isOpen = openMenuId === bug.id;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpenMenuId(isOpen ? null : bug.id)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5"
        >
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Change Status
          </p>

          {statusOptions.map((st) => {
            const ss = getStatusStyle(st);
            const isCurrent = bug.status === st;
            return (
              <button
                key={st}
                disabled={isCurrent}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm capitalize transition-colors
                    ${
                      isCurrent
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-50"
                    } ${ss.text}`}
                onClick={() => handleChangeStatus(bug, st)}
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${ss.dot}`} />
                {st}
                {isCurrent && (
                  <span className="ml-auto text-xs text-slate-400">
                    current
                  </span>
                )}
              </button>
            );
          })}

          {/* Delete — only QA (canEdit) */}
          {canEdit && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                onClick={() => handleDeleteBug(bug.id)}
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
