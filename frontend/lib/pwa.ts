export const PWA_CACHE_NAME = "mock-spotify-v1";

export function shouldBypassServiceWorker(urlString: string): boolean {
  try {
    const url = new URL(urlString, "http://localhost");
    if (url.protocol !== "http:" && url.protocol !== "https:") return true;
    if (url.pathname.startsWith("/api/")) return true;
    if (url.port === "8000") return true;
    return false;
  } catch {
    return true;
  }
}

export function isNavigationRequest(request: { mode?: string; destination?: string }): boolean {
  return request.mode === "navigate" || request.destination === "document";
}

export function shouldPrecachePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/offline" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/")
  );
}
