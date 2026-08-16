import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/store/AuthContext";
import { PlayerProvider } from "@/store/PlayerContext";
import { StorageSeed } from "@/components/providers/StorageSeed";
import { LanguageInit } from "@/components/providers/LanguageInit";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock Spotify",
  description: "A Spotify clone for the Web Programming course — Phase 1",
  applicationName: "Mock Spotify",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mock Spotify",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
          <PwaRegister />
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
