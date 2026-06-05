"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FloatingInput } from "@/components/auth/FloatingInput";
import { MailIcon, PhoneIcon, UserIcon } from "@/components/auth/icons";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AppHeader } from "@/components/layout/AppHeader";

import { getCurrentUser, type UserProfile } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const MASKED_PASSWORD = "••••••••••";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type FormState = {
  fullName: string;
  phone: string;
  email: string;
};

function profileToForm(profile: UserProfile): FormState {
  return {
    fullName: profile.full_name,
    phone: profile.phone ?? "",
    email: profile.email,
  };
}

export function ProfileSettings() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState(MASKED_PASSWORD);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
  });
  const [savedForm, setSavedForm] = useState<FormState>({
    fullName: "",
    phone: "",
    email: "",
  });

  const loadProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentUser(token);
      setProfile(data);
      const nextForm = profileToForm(data);
      setForm(nextForm);
      setSavedForm(nextForm);
      setPassword(MASKED_PASSWORD);
    } catch {
      setError("Could not load your profile. Please sign in again.");
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleCancel() {
    setForm(savedForm);
    setPassword(MASKED_PASSWORD);
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setSavedForm(form);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <div className="flex flex-1 items-center justify-center text-[15px] text-[#64748B]">
          Loading profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <AppHeader userName={profile.full_name} avatarUrl={profile.avatar_url} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-[26px] font-bold text-[#0F172A]">
          Profile Settings
        </h1>

        <div className="mt-8 flex flex-col items-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#CBD5E1] text-3xl font-semibold text-white">
              {initials(profile.full_name)}
            </div>
          )}

          <p className="mt-4 text-[20px] font-bold text-[#0F172A]">
            {profile.full_name}
          </p>

          <p className="mt-1 text-[15px] text-[#2B7FFF]">@{profile.username}</p>
        </div>

        {error && (
          <p className="mt-6 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <form
          onSubmit={handleConfirm}
          className="mx-auto mt-10 flex w-full max-w-md flex-col gap-5"
        >
          <FloatingInput
            label="Full Name"
            value={form.fullName}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            icon={<UserIcon />}
            autoComplete="name"
            disabled={true}
          />

          <FloatingInput
            label="Mobile number"
            type="tel"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            icon={<PhoneIcon />}
            autoComplete="tel"
            disabled={true}
          />

          <FloatingInput
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            icon={<MailIcon />}
            autoComplete="email"
            disabled={true}
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {/* <div className="mt-2 flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-[#2B7FFF] py-3.5 text-[15px] font-semibold text-[#2B7FFF] transition-colors hover:bg-[#2B7FFF]/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#2B7FFF] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1a6fe8]"
            >
              Confirm
            </button>
          </div> */}
        </form>
      </main>
    </div>
  );
}
