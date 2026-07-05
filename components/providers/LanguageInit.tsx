"use client";

import { useEffect } from "react";
import { getAppSettings } from "@/lib/storage";

export function LanguageInit() {
  useEffect(() => {
    const { language } = getAppSettings();
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  }, []);

  return null;
}
