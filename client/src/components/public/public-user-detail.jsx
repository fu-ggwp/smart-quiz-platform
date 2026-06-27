"use client";

import { useEffect, useState } from "react";
import { AlertCircle, BookOpen, CalendarDays, UserRound } from "lucide-react";

import { StudySetCard } from "@/components/study-set/study-set-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usersService } from "@/services/users.service";

function getInitial(value) {
  return String(value || "?")
    .charAt(0)
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDisplayName(user) {
  return user?.full_name || user?.username || "Public user";
}

export function PublicUserDetail({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const { data } = await usersService.getPublicProfile(username);

        if (active) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return <StatePanel title="Loading user profile" />;
  }

  if (error) {
    const isNotFound = error?.response?.status === 404;

    return (
      <StatePanel
        icon={<AlertCircle />}
        title={isNotFound ? "User not found" : "Unable to load user profile"}
        description={
          isNotFound
            ? "This public user does not exist or is no longer active."
            : "Please check the connection and try again."
        }
      />
    );
  }

  const user = profile?.user;
  const studySets = profile?.studySets ?? [];
  const displayName = getDisplayName(user);

  return (
    <div className="flex flex-col gap-8">
      <Card className="overflow-hidden rounded-lg border border-border">
        <CardHeader className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <Avatar className="size-16 sm:size-20" size="xl">
            {user?.avatar_url ? (
              <AvatarImage alt={displayName} src={user.avatar_url} />
            ) : null}
            <AvatarFallback className="text-xl font-bold sm:text-2xl">
              {getInitial(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <CardTitle className="min-w-0 flex-1 truncate text-2xl font-bold text-foreground sm:text-3xl">
              {displayName}
            </CardTitle>
            <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
              @{user?.username}
            </p>
            {user?.bio ? (
              <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-muted-foreground">
                {user.bio}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-2 [&>svg]:size-4">
                <CalendarDays data-icon="inline-start" />
                Joined {formatDate(user?.created_at)}
              </span>
              <span className="inline-flex items-center gap-2 [&>svg]:size-4">
                <BookOpen data-icon="inline-start" />
                {studySets.length} public study sets
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Public study sets
        </h2>

        {studySets.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {studySets.map((studySet) => (
              <StudySetCard
                key={studySet.study_set_id ?? studySet.id}
                studySet={studySet}
              />
            ))}
          </div>
        ) : (
          <StatePanel
            icon={<BookOpen />}
            title="No public study sets"
            description="This user has not shared any public study sets yet."
          />
        )}
      </section>
    </div>
  );
}

function StatePanel({ description, icon, title }) {
  return (
    <Card className="rounded-lg border border-dashed border-border">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        {icon ? (
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound />
          </div>
        )}
        <CardTitle className="text-base font-bold text-foreground">
          {title}
        </CardTitle>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
