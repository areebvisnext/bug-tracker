"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { FloatingInput } from "@/components/auth/FloatingInput";
import { MailIcon, PhoneIcon, UserIcon } from "@/components/auth/icons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { RoleSelect } from "@/components/auth/RoleSelect";

import { signupUser, type UserRole } from "@/lib/api";

const ROLES: UserRole[] = ["Manager", "QA", "Developer"];

function parseRole(value: string | null): UserRole {
  if (value && ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return "Manager";
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("Manager");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(parseRole(searchParams.get("role")));
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signupUser({
        full_name: fullName,
        email,
        phone,
        password,
        role,
      });
      router.push("/auth/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
          Sign Up
        </h1>
        <p className="mt-2 text-[15px] text-[#64748B]">
          Please fill your information below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FloatingInput
          label="Name"
          value={fullName}
          onChange={setFullName}
          icon={<UserIcon />}
          autoComplete="name"
          required
          disabled={false}
        />

        <RoleSelect value={role} onChange={setRole} />

        <FloatingInput
          label="Mobile number"
          type="tel"
          value={phone}
          onChange={setPhone}
          icon={<PhoneIcon />}
          autoComplete="tel"
          required
          disabled={false}
        />

        <FloatingInput
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          icon={<MailIcon />}
          autoComplete="email"
          required
          disabled={false}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="pt-1">
          <PrimaryButton loading={loading}>Sign Up</PrimaryButton>
        </div>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#94A3B8]">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#2B7FFF] hover:underline"
        >
          Login to your account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
