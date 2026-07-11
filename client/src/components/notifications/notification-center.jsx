"use client";

import { useRouter } from "next/navigation";
import { Bell, MoreHorizontal } from "lucide-react";
import { useCallback, useState } from "react";

import ConfirmModal from "@/components/common/ConfirmModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { notificationsService } from "@/services/notifications.service";
import { profileService } from "@/services/profile.service";

const PAGE_SIZE = 20;

function getRequiredRoleFromUrl(targetUrl) {
  if (!targetUrl) return null;
  if (targetUrl === "/teacher" || targetUrl.startsWith("/teacher/"))
    return "teacher";
  if (targetUrl === "/learner" || targetUrl.startsWith("/learner/"))
    return "learner";
  return null;
}

function needsRoleSwitch(currentRole, requiredRole) {
  return Boolean(requiredRole && currentRole !== requiredRole);
}

function getRoleLabel(role) {
  if (role === "teacher") return "Teacher";
  if (role === "learner") return "Learner";
  return "Required";
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2 rounded-xl px-3 py-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function NotificationCenter() {
  const router = useRouter();
  const { role, setProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const loadNotifications = useCallback(
    async ({ offset = 0, reset = false } = {}) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const [listResult, countResult] = await Promise.all([
          notificationsService.list({ limit: PAGE_SIZE, offset }),
          reset ? notificationsService.getUnreadCount() : Promise.resolve(null),
        ]);

        setNotifications((current) =>
          reset
            ? listResult.notifications || []
            : [...current, ...(listResult.notifications || [])],
        );
        setNextOffset(listResult.nextOffset);
        setHasMore(Boolean(listResult.hasMore));
        if (countResult) setUnreadCount(countResult.count || 0);
      } catch (loadError) {
        console.error("Failed to load notifications", loadError);
        setError("Could not load notifications.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  function handleOpenChange(open) {
    setIsOpen(open);

    if (open && !isLoading) {
      loadNotifications({ offset: 0, reset: true });
    }
  }

  function handleRetry() {
    loadNotifications({ offset: 0, reset: true });
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;

    try {
      await notificationsService.markAllAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true })),
      );
      setUnreadCount(0);
    } catch (markError) {
      console.error("Failed to mark notifications as read", markError);
    }
  }

  async function markNotificationRead(notification) {
    if (notification.is_read) return;

    try {
      await notificationsService.markAsRead(notification.notification_id);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notification.notification_id
            ? { ...item, is_read: true }
            : item,
        ),
      );
      setUnreadCount((count) => Math.max(count - 1, 0));
    } catch (markError) {
      console.error("Failed to mark notification as read", markError);
    }
  }
  async function handleDeleteNotification(notification) {
    try {
      await notificationsService.remove(notification.notification_id);
      setNotifications((current) =>
        current.filter(
          (item) => item.notification_id !== notification.notification_id,
        ),
      );
      if (!notification.is_read) {
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (deleteError) {
      console.error("Failed to delete notification", deleteError);
    }
  }
  function navigateToNotification(notification) {
    if (notification.target_url) {
      setIsOpen(false);
      router.push(notification.target_url);
    }
  }

  function reloadToNotification(notification) {
    if (notification.target_url) {
      window.location.assign(notification.target_url);
    }
  }

  async function handleNotificationClick(notification) {
    await markNotificationRead(notification);

    const requiredRole = getRequiredRoleFromUrl(notification.target_url);
    if (needsRoleSwitch(role, requiredRole)) {
      setIsOpen(false);
      setPendingNotification(notification);
      setSwitchError("");
      setIsSwitchConfirmOpen(true);
      return;
    }

    navigateToNotification(notification);
  }

  function handleSwitchCancel() {
    if (isSwitchingRole) return;

    setIsSwitchConfirmOpen(false);
    setPendingNotification(null);
    setSwitchError("");
  }

  async function handleSwitchConfirm() {
    if (isSwitchingRole || !pendingNotification?.target_url) return;

    const requiredRole = getRequiredRoleFromUrl(pendingNotification.target_url);
    if (!requiredRole || role === requiredRole) {
      navigateToNotification(pendingNotification);
      setIsSwitchConfirmOpen(false);
      setPendingNotification(null);
      return;
    }

    setIsSwitchingRole(true);
    setSwitchError("");

    try {
      const profile = await profileService.switchRole(requiredRole);
      setProfile(profile);
      setIsSwitchConfirmOpen(false);
      reloadToNotification(pendingNotification);
      setPendingNotification(null);
    } catch (error) {
      console.error("Failed to switch role from notification", error);
      setSwitchError("Could not switch role. Please try again.");
    } finally {
      setIsSwitchingRole(false);
    }
  }

  function handleLoadMore() {
    if (!hasMore || isLoadingMore || isLoading) return;

    loadNotifications({ offset: nextOffset || 0 });
  }

  const requiredSwitchRole = getRequiredRoleFromUrl(
    pendingNotification?.target_url,
  );
  const roleLabel = getRoleLabel(requiredSwitchRole);
  const switchMessage = [
    `This notification opens a ${roleLabel} page. Switch role to continue?`,
    switchError,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open notifications"
            className="relative rounded-full"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Bell />
            {unreadCount > 0 ? (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px] leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            ) : null}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[min(calc(100vw-2rem),380px)] p-0"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <h2 className="text-base font-bold text-foreground">
              Notifications
            </h2>
            <Button
              disabled={unreadCount === 0}
              onClick={handleMarkAllAsRead}
              size="sm"
              type="button"
              variant="ghost"
            >
              Mark all as read
            </Button>
          </div>

          <div className="max-h-[480px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-1">
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="grid gap-3 px-3 py-8 text-center">
                <p className="text-sm font-medium text-foreground">{error}</p>
                <Button
                  className="mx-auto"
                  onClick={handleRetry}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {!isLoading && !error && notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : null}

            {!isLoading && !error && notifications.length > 0 ? (
              <div className="grid gap-1">
                {notifications.map((notification) => (
                  <article
                    className={cn(
                      "w-full rounded-xl px-3 py-3 text-left flex transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                      !notification.is_read && "bg-primary/10",
                    )}
                    key={notification.notification_id}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full bg-transparent",
                          !notification.is_read && "bg-primary",
                        )}
                      />
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => handleNotificationClick(notification)}
                        type="button"
                      >
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {notification.title}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-sm font-normal text-muted-foreground">
                          {notification.message}
                        </span>
                        <span className="mt-2 block text-xs font-medium text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                      </button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="ml-auto h-6 w-6"
                          size="icon"
                          variant="ghost"
                          type="button"
                          aria-label="Notification actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => markNotificationRead(notification)}
                        >
                          Mark as read
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteNotification(notification)}
                          variant="destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </article>
                ))}
              </div>
            ) : null}

            {hasMore && !isLoading && !error && notifications.length > 0 ? (
              <div className="px-3 py-2">
                <Button
                  className="w-full"
                  disabled={isLoadingMore}
                  onClick={handleLoadMore}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmModal
        cancelLabel="Cancel"
        confirmLabel={isSwitchingRole ? "Switching..." : "Switch and open"}
        isOpen={isSwitchConfirmOpen}
        message={switchMessage}
        onCancel={handleSwitchCancel}
        onConfirm={handleSwitchConfirm}
        title="Switch role required"
        variant={switchError ? "warning" : "info"}
      />
    </>
  );
}
