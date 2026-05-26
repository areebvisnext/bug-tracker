"use client";

import { useId, useState } from "react";
import type { UserRole } from "@/lib/api";
import { UserIcon } from "./icons";

const ROLES: UserRole[] = ["Manager", "QA", "Developer"];

type RoleSelectProps = {
  value: UserRole;
  onChange: (value: UserRole) => void;
};

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-11 z-10 origin-left transition-all duration-150 ${
          floated
            ? "top-0 -translate-y-1/2 scale-[0.85] bg-white px-1 text-[13px] font-medium text-[#2B7FFF]"
            : "top-1/2 -translate-y-1/2 text-[15px] text-[#94A3B8]"
        }`}
      >
        Role
      </label>
      <div
        className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#F4F6F8] px-4 py-3.5 transition-colors ${
          focused
            ? "border-[#2B7FFF] bg-white"
            : "border-transparent"
        }`}
      >
        <UserIcon className="shrink-0 text-[#64748B]" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as UserRole)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full cursor-pointer appearance-none bg-transparent text-[15px] text-[#0F172A] outline-none"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
