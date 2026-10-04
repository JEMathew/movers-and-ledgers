/** Firebase client tokens are verified by the API, never trusted as client assertions. */
export function cloudIdentity() {
  return process.env.NEXT_PUBLIC_IDENTITY_MODE === "firebase";
}

/** The local demo workspace is offered only outside production and only without Google identity.
 *  Plain function, usable from server pages and client components alike. */
export function demoEntry() {
  return !cloudIdentity() && process.env.NODE_ENV !== "production";
}

let prepared: Promise<GoogleIdentityRuntime> | undefined;

async function initializeGoogleIdentity() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!cloudIdentity() || !projectId || !apiKey || !authDomain) throw new Error("Cloud sign-in is not configured. No demo fallback was used.");
  const [{ getApps, initializeApp }, sdk] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const { getAuth, setPersistence, browserSessionPersistence } = sdk;
  const app = getApps()[0] ?? initializeApp({ projectId, apiKey, authDomain });
  const auth = getAuth(app);
  await setPersistence(auth, browserSessionPersistence);
  await auth.authStateReady();
  const provider = new sdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return {
    auth,
    // Invoke directly from a ready UI click. No import/initialization/await here.
    signIn: () => sdk.signInWithPopup(auth, provider),
    signOut: () => sdk.signOut(auth),
    subscribe: (listener: (user: import("firebase/auth").User | null) => void) => sdk.onIdTokenChanged(auth, listener),
  };
}

export type GoogleIdentityRuntime = Awaited<ReturnType<typeof initializeGoogleIdentity>>;

/** Shared by page controls and API requests; persistence is initialized only once. */
export function prepareGoogleIdentity() {
  prepared ??= initializeGoogleIdentity().catch(error => { prepared = undefined; throw error; });
  return prepared;
}

export async function firebaseAuth() {
  return (await prepareGoogleIdentity()).auth;
}

export type VerifiedIdentity = { subject: string; email: string };

// The private proxy allows 60s for the read-only upstream request. Leave a small
// transport margin: a min-zero API's first verified request can exceed 15s.
const IDENTITY_VERIFICATION_TIMEOUT_MS = 65_000;

/** The only relative cloud endpoint is the same-origin, fixed /api proxy. */
export function identityEndpoint(base: string | undefined, browserOrigin?: string) {
  const endpoint = base === "/api" ? new URL("/api", browserOrigin) : new URL(base ?? "http://invalid");
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) throw new Error("Invalid identity endpoint: HTTPS without credentials is required");
  return endpoint;
}

/** Display only the API-verified session, never a workspace actor or browser owner claim. */
export async function verifiedIdentity(user: import("firebase/auth").User): Promise<VerifiedIdentity> {
  const endpoint = identityEndpoint(process.env.NEXT_PUBLIC_API_BASE_URL, window.location.origin);
  const response = await fetch(`${endpoint.href.replace(/\/$/, "")}/v1/identity`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store", credentials: "omit", redirect: "error", signal: AbortSignal.timeout(IDENTITY_VERIFICATION_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("Session verification failed");
  const value = await response.json();
  if (value.subject !== `firebase:${user.uid}` || typeof value.email !== "string" || !value.email) throw new Error("Session identity mismatch");
  return { subject: value.subject, email: value.email };
}

export function signInError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  switch (code) {
    case "auth/popup-blocked": return "Your browser blocked the Google sign-in popup. Allow popups for this site, then select Sign in again. No demo sign-in occurred.";
    case "auth/popup-closed-by-user": return "Google sign-in was closed before completion. Select Sign in when you are ready. No demo sign-in occurred.";
    case "auth/cancelled-popup-request": return "Another Google sign-in request interrupted this one. Finish one sign-in window at a time. No demo sign-in occurred.";
    case "auth/network-request-failed": return "Google sign-in could not reach the authentication service. Check your connection and try again. No demo sign-in occurred.";
    case "auth/unauthorized-domain": return "Google sign-in is not configured for this site. Contact the Beta operator. No demo sign-in occurred.";
    case "auth/web-storage-unsupported": return "Google sign-in requires browser session storage. Check this site's storage settings. No demo sign-in occurred.";
    default: return "Google sign-in or session verification failed. Try again or contact the Beta operator. No demo sign-in occurred.";
  }
}

export async function authHeaders(): Promise<Record<string, string>> {
  if (cloudIdentity()) {
    identityEndpoint(process.env.NEXT_PUBLIC_API_BASE_URL, window.location.origin);
    const auth = await firebaseAuth();
    if (!auth.currentUser) throw new Error("Sign in with Google to access this workspace.");
    return { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` };
  }
  if (process.env.NODE_ENV === "production") throw new Error("Identity is unavailable. Local demo access is disabled in production builds.");
  return { Authorization: "Bearer demo-user" };
}

export function safeDestination(value: string) {
  const unsafeCharacter = [...value].some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === "\\");
  return value.startsWith("/") && !value.startsWith("//") && !unsafeCharacter ? value : "/workspace";
}

export function navigateAfterAuth(destination: string) {
  window.location.assign(safeDestination(destination));
}
