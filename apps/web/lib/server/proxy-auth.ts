import "server-only";
import { GoogleAuth } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const googleAuth = new GoogleAuth();

export async function verifyUser(token: string, projectId: string) {
  const { payload, protectedHeader } = await jwtVerify(token, keys, {
    algorithms: ["RS256"], audience: projectId, issuer: `https://securetoken.google.com/${projectId}`,
    requiredClaims: ["sub", "exp", "iat", "auth_time"],
  });
  const now = Math.floor(Date.now() / 1000);
  if (!protectedHeader.kid || payload.aud !== projectId || !payload.sub || payload.sub.length > 128 ||
      typeof payload.iat !== "number" || payload.iat < 0 || payload.iat > now ||
      typeof payload.auth_time !== "number" || payload.auth_time > now || payload.auth_time < 0) {
    throw new Error("Invalid Firebase identity");
  }
  // Revocation/disabled-user checks and all owner checks remain authoritative in the API.
}

export async function workloadAuthorization(audience: string) {
  const client = await googleAuth.getIdTokenClient(audience);
  const headers = await client.getRequestHeaders();
  const authorization = headers.get("authorization");
  if (!authorization) throw new Error("Workload identity unavailable");
  return authorization;
}
