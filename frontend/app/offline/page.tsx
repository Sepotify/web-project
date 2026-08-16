export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-primary px-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        📡
      </p>
      <h1 className="text-2xl font-semibold text-text-primary">You are offline</h1>
      <p className="max-w-md text-sm text-text-secondary">
        Mock Spotify is installed as an app, but this page needs a connection. Reconnect
        and try again.
      </p>
    </main>
  );
}
