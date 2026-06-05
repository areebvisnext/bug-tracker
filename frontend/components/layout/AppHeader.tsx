"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useState, useRef, useEffect } from "react";

import { logoutUser } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type AppHeaderProps = {
  userName: string;
  avatarUrl?: string | null;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppHeader({ userName, avatarUrl }: AppHeaderProps) {
  const router = useRouter();

  const firstName = userName.split(" ")[0] || "User";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/auth/me" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B7FFF] text-sm font-bold text-white">
              M
            </span>

            <span className="text-[17px] font-semibold text-[#0F172A]">
              ManageBug
            </span>
          </Link>

          <nav className="hidden items-center gap-8 sm:flex">
            <Link
              href="/projects"
              className="flex items-center gap-2 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <FolderIcon />
              Projects
            </Link>

            <Link
              href="/bugs"
              className="flex items-center gap-2 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <BugIcon />
              Bugs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            className="relative text-[#64748B] hover:text-[#0F172A]"
            aria-label="Notifications"
          >
            <BellIcon />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-[#F1F5F9] transition-colors"
              aria-expanded={open}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E2E8F0] text-xs font-semibold text-[#475569]">
                  {initials(userName)}
                </span>
              )}

              <span className="text-[14px] font-medium text-[#0F172A]">
                {firstName}
              </span>

              <ChevronIcon open={open} />
            </button>

            {open && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-md z-50">
                <button
                  type="button"
                  onClick={async () => {
                    setOpen(false);

                    const token = await getAccessToken();

                    try {
                      await logoutUser(token);
                      router.replace("/auth/login");
                    } catch {
                      alert("Error while loggig out");
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{
        transition: "transform 0.15s",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 7h6l2 2h10v10H3V7z" />
    </svg>
  );
}

function BugIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <path d="M12 8V5M8 6l-2-2M16 6l2-2M7 11H4M17 11h3M8 17l-2 2M16 17l2 2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M18 16H6l1.5-1.5V10a4.5 4.5 0 0 1 9 0v4.5L18 16z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}
