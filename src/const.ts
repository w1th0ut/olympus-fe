export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = process.env.NEXT_PUBLIC_OAUTH_PORTAL_URL;
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  if (!oauthPortalUrl) {
    throw new Error("NEXT_PUBLIC_OAUTH_PORTAL_URL is not set.");
  }
  if (!appId) {
    throw new Error("NEXT_PUBLIC_APP_ID is not set.");
  }
  if (typeof window === "undefined") {
    throw new Error("getLoginUrl must be called in the browser.");
  }
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};