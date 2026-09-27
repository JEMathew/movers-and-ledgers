/** Firebase client tokens are verified by the API, never trusted as client assertions. */
export function cloudIdentity() {
  return process.env.NEXT_PUBLIC_IDENTITY_MODE === "firebase";
}

export async function firebaseAuth() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!cloudIdentity() || !projectId || !apiKey || !authDomain) throw new Error("Cloud sign-in is not configured. No demo fallback was used.");
  const [{ getApps, initializeApp }, { getAuth, setPersistence, browserSessionPersistence }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps()[0] ?? initializeApp({ projectId, apiKey, authDomain });
  const auth = getAuth(app);
  await setPersistence(auth, browserSessionPersistence);
  await auth.authStateReady();
  return auth;
}

export async function authHeaders(): Promise<Record<string, string>> {
  if (cloudIdentity()) {
    const endpoint = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://invalid");
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) throw new Error("Cloud API is not configured with HTTPS. No token was sent.");
    const auth = await firebaseAuth();
    if (!auth.currentUser) throw new Error("Sign in with Google to access this workspace.");
    return { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` };
  }
  if (process.env.NODE_ENV === "production") throw new Error("Identity is unavailable. Local demo access is disabled in production builds.");
  return { Authorization: "Bearer demo-user" };
}

export function safeDestination(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/workspace";
}
