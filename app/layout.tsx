import type { Metadata } from "next";
import { AuthProvider } from "@/store/AuthContext";
import { PlayerProvider } from "@/store/PlayerContext";
import { StorageSeed } from "@/components/providers/StorageSeed";
import { LanguageInit } from "@/components/providers/LanguageInit";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock Spotify",
  description: "A Spotify clone for the Web Programming course — Phase 1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <StorageSeed>
          <LanguageInit />
          <AuthProvider>
            <PlayerProvider>
              <ToastProvider>{children}</ToastProvider>
            </PlayerProvider>
          </AuthProvider>
        </StorageSeed>
      </body>
    </html>
  );
}
