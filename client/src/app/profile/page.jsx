"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Crown,
  Edit3,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  RefreshCcw,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService, clearAuthCookie } from "@/services/auth.service";
import { profileService } from "@/services/profile.service";

const PROFILE_LOGIN_PATH = "/login?next=%2Fprofile";

function getErrorStatus(error) {
  return error?.response?.status || error?.status || null;
}

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

function DetailItem({ icon: Icon, label, value }) {
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

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
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
    </main>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const currentProfile = await profileService.getMine();
      setProfile(currentProfile);
    } catch (loadError) {
      const status = getErrorStatus(loadError);

      if (status === 401 || status === 403) {
        clearAuthCookie();
        router.replace(PROFILE_LOGIN_PATH);
        return;
      }

      setError("Failed to load profile. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  function handleRetry() {
    setLoading(true);
    setError("");
    loadProfile();
  }

  useEffect(() => {
    let isActive = true;

    profileService
      .getMine()
      .then((currentProfile) => {
        if (!isActive) return;
        setProfile(currentProfile);
      })
      .catch((loadError) => {
        const status = getErrorStatus(loadError);

        if (status === 401 || status === 403) {
          clearAuthCookie();
          router.replace(PROFILE_LOGIN_PATH);
          return;
        }

        if (isActive) {
          setError("Failed to load profile. Please check your connection and try again.");
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [router]);

  const initials = useMemo(() => getInitials(profile), [profile]);
  const joinedDate = useMemo(
    () => formatJoinedDate(profile?.createdAt),
    [profile?.createdAt],
  );

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await authService.logout();
    } catch (logoutError) {
      console.error("Logout failed after clearing local auth", logoutError);
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
          <div className="w-full rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <RefreshCcw className="size-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Profile unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button type="button" className="mt-5" onClick={handleRetry}>
              <RefreshCcw data-icon="inline-start" />
              Retry
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              Account profile
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              My Profile
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/profile/edit">
                <Edit3 data-icon="inline-start" />
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile/change-password">
                <KeyRound data-icon="inline-start" />
                Change Password
              </Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut data-icon="inline-start" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile?.avatarUrl ? (
              <div
                role="img"
                aria-label={`${profile.fullName || profile.username}'s avatar`}
                className="size-24 rounded-lg border border-border bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.avatarUrl})` }}
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-lg bg-primary text-2xl font-semibold text-primary-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-2xl font-semibold">
                  {profile?.fullName || "Unnamed user"}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <Crown className="size-3.5" />
                  {profile?.isPremium ? "Premium" : "Free"}
                </span>
              </div>
              <p className="mt-1 break-words text-sm font-medium text-muted-foreground">
                @{profile?.username || "unknown"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailItem
            icon={Mail}
            label="Email"
            value={profile?.email || "Not available"}
          />
          <DetailItem
            icon={Phone}
            label="Phone"
            value={profile?.phoneNumber || "Not provided"}
          />
          <DetailItem icon={CalendarDays} label="Joined" value={joinedDate} />
          <DetailItem
            icon={UserRound}
            label="Bio"
            value={profile?.bio || "No bio yet"}
          />
        </div>
      </section>
    </main>
  );
}
