"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getInitial(value) {
  return String(value || "?")
    .charAt(0)
    .toUpperCase();
}

function formatShortDate(value) {
  if (!value) return "Recently updated";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDisplayName(user) {
  return user?.full_name || user?.username || "Public user";
}

export function PublicUserCard({ user }) {
  const displayName = getDisplayName(user);
  const href = user?.username ? `/users/${user.username}` : "/search";

  return (
    <Link
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
    >
      <Card className="min-h-52 rounded-lg border border-border py-0 transition-colors hover:border-primary/60 hover:bg-accent/30">
        <CardHeader className="flex flex-col items-start gap-4 px-5 pt-5">
          <Avatar className="size-16">
            {user?.avatar_url ? (
              <AvatarImage alt={displayName} src={user.avatar_url} />
            ) : null}
            <AvatarFallback className="text-xl font-bold">
              {getInitial(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 self-stretch">
            <CardTitle className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">
              {displayName}
            </CardTitle>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              @{user?.username}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground [&>svg]:size-4">
            <CalendarDays data-icon="inline-start" />
            Joined {formatShortDate(user?.created_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
