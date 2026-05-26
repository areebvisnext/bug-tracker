"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { RoleCard } from "@/components/home/RoleCard";
import { ROLE_OPTIONS } from "@/components/home/role-options";
import type { UserRole } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("Manager");

  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role);
    router.push(`/auth/signup?role=${encodeURIComponent(role)}`);
  }

  return (
    <AuthSplitLayout
      contentClassName="max-w-[400px]"
      header={
        <p className="text-[14px] text-[#64748B]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[#2B7FFF] hover:underline"
          >
            Sign In
          </Link>
        </p>
      }
    >
      <div className="mb-4">
        <h1 className="text-[32px] font-bold tracking-tight text-[#0F172A]">
          Join Us!
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#64748B]">
          To begin this journey, tell us what type of account you&apos;d be
          opening.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {ROLE_OPTIONS.map((option) => {
          const selected = selectedRole === option.role;
          return (
            <RoleCard
              key={option.role}
              title={option.title}
              description={option.description}
              icon={selected ? option.selectedIcon : option.icon}
              selected={selected}
              onClick={() => handleRoleSelect(option.role)}
            />
          );
        })}
      </div>
    </AuthSplitLayout>
  );
}
