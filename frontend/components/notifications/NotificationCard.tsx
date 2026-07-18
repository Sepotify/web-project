"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { NOTIFICATION_LABELS } from "@/lib/settings";
import { formatNotificationDate } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const isUnread = !notification.isRead;

  return (
    <article
      className={cn(
        "relative rounded-lg border border-border-default p-4 transition-colors sm:p-5",
        isUnread ? "bg-accent-primary/5" : "bg-bg-elevated",
      )}
    >
      {isUnread && (
        <span
          className="absolute left-3 top-5 h-2.5 w-2.5 rounded-full bg-accent-primary sm:left-4"
          aria-hidden="true"
        />
      )}

      <div className={cn("flex flex-col gap-3", isUnread && "pl-5 sm:pl-6")}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={cn(
                  "text-base text-text-primary",
                  isUnread ? "font-semibold" : "font-medium",
                )}
              >
                {notification.title}
              </h2>
              {isUnread && (
                <span className="rounded-full bg-accent-primary/20 px-2 py-0.5 text-xs font-medium text-accent-primary">
                  New
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {NOTIFICATION_LABELS[notification.type]}
            </p>
          </div>

          <time
            dateTime={notification.createdAt}
            className="shrink-0 text-xs text-text-muted"
          >
            {formatNotificationDate(notification.createdAt)}
          </time>
        </div>

        <p className="text-sm text-text-secondary">{notification.message}</p>

        <div className="flex flex-wrap items-center gap-2">
          {notification.link && (
            <Link href={notification.link}>
              <Button size="sm" variant="secondary">
                View
              </Button>
            </Link>
          )}

          {isUnread && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark as read
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(notification.id)}
            className="text-accent-danger hover:text-accent-danger"
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
