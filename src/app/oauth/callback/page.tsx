export default function OAuthCallbackPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Sign-in complete</h1>
        <p className="text-sm text-muted-foreground">
          You can safely close this tab and return to the app.
        </p>
      </div>
    </main>
  );
}
