import type { Metadata } from "next";
import { AuthProvider } from "@/store/AuthContext";
import { StorageSeed } from "@/components/providers/StorageSeed";
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
    <html lang="fa" dir="rtl">
      <body>
        <StorageSeed>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </StorageSeed>
      </body>
    </html>
  );
}
