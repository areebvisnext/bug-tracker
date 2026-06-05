"use client";

import { useId, useState } from "react";

type FloatingInputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
};

export function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  icon,
  autoComplete,
  required,
}: FloatingInputProps) {
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
        {label}
      </label>

      <div
        className={`flex items-center gap-3 rounded-lg border bg-[#F4F6F8] px-4 py-3.5 transition-colors ${
          focused ? "border-[#2B7FFF] bg-white" : "border-transparent"
        }`}
      >
        {icon && <span className="shrink-0 text-[#64748B]">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[15px] text-[#0F172A] outline-none placeholder:text-transparent"
        />
      </div>
    </div>
  );
}
