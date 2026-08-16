import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "www.soundhelix.com", "soundhelix.com"]);

function isPrivateLanHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

function isAllowedMediaUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (ALLOWED_HOSTS.has(parsed.hostname) || isPrivateLanHostname(parsed.hostname)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new Response("Missing url", { status: 400 });
  }

  const target = isAllowedMediaUrl(rawUrl);
  if (!target) {
    return new Response("Forbidden media host", { status: 403 });
  }

  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);

  const upstream = await fetch(target.href, { headers });
  const responseHeaders = new Headers();
  const passThrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
  ];

  for (const name of passThrough) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  if (!responseHeaders.has("Accept-Ranges")) {
    responseHeaders.set("Accept-Ranges", "bytes");
  }

  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
