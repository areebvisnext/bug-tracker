"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

type PasswordInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  required,
}: PasswordInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
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
        {label}
      </label>
      <div
        className={`flex items-center gap-3 rounded-lg border bg-[#F4F6F8] px-4 py-3.5 transition-colors ${
          focused
            ? "border-[#2B7FFF] bg-white"
            : "border-transparent"
        }`}
      >
        <LockIcon className="shrink-0 text-[#64748B]" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[15px] text-[#0F172A] outline-none placeholder:text-transparent"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-[#94A3B8] hover:text-[#64748B]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOffIcon className="text-[#94A3B8]" />
          ) : (
            <EyeIcon className="text-[#94A3B8]" />
          )}
        </button>
      </div>
    </div>
  );
}
