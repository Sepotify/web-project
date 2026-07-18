"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SoundSettings } from "@/components/settings/SoundSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { SupportTicketForm } from "@/components/settings/SupportTicketForm";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreference,
} from "@/lib/notification-preferences";
import { deleteUserAccount } from "@/lib/storage";
import { useAuth } from "@/store/AuthContext";
import type { NotificationType } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const { settings, updateSettings } = useAppSettings();
  const { showToast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(() =>
    user ? getUserNotificationPreferences(user.id) : null,
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setNotificationPreferences(getUserNotificationPreferences(user.id));
    }
  }, [user]);

  function handleNotificationChange(type: NotificationType, enabled: boolean) {
    if (!user) return;

    updateUserNotificationPreference(user.id, type, enabled);
    setNotificationPreferences(getUserNotificationPreferences(user.id));
    refreshUser();
    showToast("Notification preference updated.", "success");
  }

  function handleLanguageChange(language: typeof settings.language) {
    updateSettings({ language });
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    showToast("Language preference saved.", "success");
  }

  function handleVolumeChange(defaultVolume: number) {
    updateSettings({ defaultVolume });
  }

  function handleDeleteAccount() {
    if (!user) return;

    setIsDeleting(true);
    const success = deleteUserAccount(user.id);
    setIsDeleting(false);

    if (!success) {
      showToast("Failed to delete account.", "error");
      return;
    }

    logout();
    showToast("Your account has been deleted.", "success");
    router.replace("/login");
  }

  if (isLoading || !user || !notificationPreferences) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-text-secondary">Loading settings...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 sm:gap-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage notifications, language, sound, and your account.
          </p>
        </div>

        <SettingsSection
          title="Subscription"
          description="View your current plan and upgrade options."
        >
          <SubscriptionSettings tier={user.subscription} />
        </SettingsSection>

        <SettingsSection
          title="Notifications"
          description="Choose which alerts you want to receive."
        >
          <NotificationSettings
            role={user.role}
            preferences={notificationPreferences}
            onChange={handleNotificationChange}
          />
        </SettingsSection>

        {(user.role === "listener" || user.role === "artist") && (
          <SettingsSection
            title="Support"
            description="Open a ticket when you need help from the support team."
          >
            <SupportTicketForm
              userId={user.id}
              onSubmitted={() => {
                showToast("Support ticket submitted. Staff will follow up soon.", "success");
              }}
            />
          </SettingsSection>
        )}

        <SettingsSection
          title="Language"
          description="Select your preferred app language."
        >
          <LanguageSettings
            language={settings.language}
            onChange={handleLanguageChange}
          />
        </SettingsSection>

        <SettingsSection
          title="Sound"
          description="Adjust default playback volume."
        >
          <SoundSettings
            defaultVolume={settings.defaultVolume}
            onChange={handleVolumeChange}
          />
        </SettingsSection>

        <SettingsSection
          title="Account"
          description="Permanently remove your account and local data."
          className="border-accent-danger/30"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Deleting your account removes your profile, playlists, and saved
              preferences from this device.
            </p>
            <Button
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              className="w-full sm:w-auto"
            >
              Delete account
            </Button>
          </div>
        </SettingsSection>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteOpen}
        email={user.email}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
      />
    </AppShell>
  );
}
