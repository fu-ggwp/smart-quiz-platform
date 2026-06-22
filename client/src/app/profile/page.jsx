"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Crown,
  KeyRound,
  Mail,
  Save,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import supabase from "@/lib/supabaseClient";
import { profileService } from "@/services/profile.service";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

function getInitials(profile) {
  const source = profile?.fullName || profile?.username || "User";
  const words = source.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatJoinedDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toProfileForm(profile) {
  return {
    fullName: profile?.fullName || "",
    username: profile?.username || "",
    phoneNumber: profile?.phoneNumber || "",
    bio: profile?.bio || "",
    avatarUrl: profile?.avatarUrl || "",
  };
}

function ReadOnlyDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg border border-border bg-background p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(() => toProfileForm(null));
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isActive = true;

    profileService
      .getMine()
      .then((currentProfile) => {
        if (!isActive) return;
        const nextForm = toProfileForm(currentProfile);
        setProfile(currentProfile);
        setForm(nextForm);
      })
      .catch((loadError) => {
        console.error("Failed to load profile", loadError);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const initials = useMemo(
    () => getInitials({ fullName: form.fullName, username: form.username }),
    [form.fullName, form.username],
  );
  const joinedDate = useMemo(
    () => formatJoinedDate(profile?.createdAt),
    [profile?.createdAt],
  );
  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setStatusMessage("");
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setStatusMessage("");
    setFieldErrors((current) => ({ ...current, avatarUrl: undefined }));

    if (!file) return;

    const extension = ALLOWED_AVATAR_TYPES.get(file.type);
    if (!extension) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: "Avatar must be a JPG or PNG image.",
      }));
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: "Avatar must be 5MB or smaller.",
      }));
      return;
    }

    if (!profile?.userId) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: "Profile must load before uploading an avatar.",
      }));
      return;
    }

    setIsUploading(true);

    try {
      const filePath = `${profile.userId}/avatar-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error("Avatar URL could not be created.");

      updateForm("avatarUrl", data.publicUrl);
    } catch (uploadError) {
      setFieldErrors((current) => ({
        ...current,
        avatarUrl: uploadError.message || "Avatar could not be uploaded.",
      }));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    setStatusMessage("");

    try {
      const updatedProfile = await profileService.updateMine({
        fullName: form.fullName,
        username: form.username,
        phoneNumber: form.phoneNumber,
        bio: form.bio,
        avatarUrl: form.avatarUrl || null,
      });
      const nextForm = toProfileForm(updatedProfile);
      setProfile(updatedProfile);
      setForm(nextForm);
      setStatusMessage("Your profile has been updated successfully.");
    } catch (saveError) {
      setFieldErrors(saveError?.response?.data?.fields || {});
      setStatusMessage(
        saveError?.response?.data?.message ||
          "The information could not be saved. Please check and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  //Skeleton loader
  if (loading)
    return (
      <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-5xl space-y-6">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="size-24 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-56 animate-pulse rounded bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        </section>
      </div>
    );

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <form
        className="mx-auto w-full max-w-5xl space-y-6"
        onSubmit={handleSave}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              My Profile
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/profile/change-password">
                <KeyRound data-icon="inline-start" />
                Change Password
              </Link>
            </Button>
          </div>
        </div>

        {statusMessage ? (
          <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground">
            {statusMessage}
          </div>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-3 sm:w-36">
              <label
                htmlFor="avatar"
                className="group relative flex size-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-primary text-2xl font-semibold text-primary-foreground shadow-sm transition focus-within:ring-3 focus-within:ring-ring/30"
              >
                {form.avatarUrl ? (
                  <span
                    role="img"
                    aria-label={`${form.fullName || form.username}'s avatar`}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${form.avatarUrl})` }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/70 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <span className="flex flex-col items-center gap-1 text-xs font-semibold">
                    <Upload className="size-5" />
                    {isUploading ? "Uploading" : "Upload"}
                  </span>
                </span>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleAvatarUpload}
                  disabled={isUploading || isSaving}
                  className="sr-only"
                  aria-invalid={Boolean(fieldErrors.avatarUrl)}
                />
              </label>

              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                <Crown className="size-3.5" />
                {profile?.isPremium ? "Premium" : "Free"}
              </span>

              {fieldErrors.avatarUrl ? (
                <p className="text-center text-sm text-destructive">
                  {fieldErrors.avatarUrl}
                </p>
              ) : null}
            </div>

            <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(fieldErrors.fullName)}>
                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    updateForm("fullName", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  autoComplete="name"
                />
                <FieldError>{fieldErrors.fullName}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fieldErrors.username)}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(event) =>
                    updateForm("username", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.username)}
                  autoComplete="username"
                />
                <FieldError>{fieldErrors.username}</FieldError>
              </Field>

              <Field data-invalid={Boolean(fieldErrors.phoneNumber)}>
                <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    updateForm("phoneNumber", event.target.value)
                  }
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                  autoComplete="tel"
                  placeholder="Not provided"
                />
                <FieldError>{fieldErrors.phoneNumber}</FieldError>
              </Field>

              <Field
                className="md:col-span-2"
                data-invalid={Boolean(fieldErrors.bio)}
              >
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(event) => updateForm("bio", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.bio)}
                  rows={5}
                  maxLength={500}
                  placeholder="No bio yet"
                  className="min-h-28 w-full resize-y rounded-lg border border-transparent bg-input/50 px-3 py-2 text-base outline-none transition-[color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
                />
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <FieldError>{fieldErrors.bio}</FieldError>
                  <span className="ml-auto shrink-0">
                    {form.bio.length}/500
                  </span>
                </div>
              </Field>

              <div></div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || isUploading}
                >
                  <Save data-icon="inline-start" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Account information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These details are managed by the system and cannot be changed
              here.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnlyDetail
              icon={Mail}
              label="Email"
              value={profile?.email || "Not available"}
            />
            <ReadOnlyDetail
              icon={CalendarDays}
              label="Joined"
              value={joinedDate}
            />
          </div>
        </section>
      </form>
    </div>
  );
}
