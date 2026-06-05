"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { FloatingInput } from "@/components/auth/FloatingInput";
import { MailIcon } from "@/components/auth/icons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PrimaryButton } from "@/components/auth/PrimaryButton";

import { loginUser } from "@/lib/api";
import { setTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser({ email, password });
      setTokens(data.access_token, data.refresh_token);
      router.push("/auth/me");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A]">
          Login
        </h1>

        <p className="mt-2 text-[15px] text-[#64748B]">
          Please enter your login details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="pt-1">
          <PrimaryButton loading={loading}>Login</PrimaryButton>
        </div>
      </form>

      <p className="mt-8 text-center text-[14px] text-[#94A3B8]">
        Don&apos;t have an account?{" "}
        <Link href="/" className="font-semibold text-[#2B7FFF] hover:underline">
          Create account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
