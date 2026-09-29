import { Buffer } from "node:buffer";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { verifyUser } from "./proxy-auth";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({ resolve: undefined as JWTVerifyGetKey | undefined }));
vi.mock("jose", async importOriginal => {
  const actual = await importOriginal<typeof import("jose")>();
  return { ...actual, createRemoteJWKSet: () => (...args: Parameters<JWTVerifyGetKey>) => fixture.resolve!(...args) };
});
let privateKey: CryptoKey;
beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  fixture.resolve = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: "synthetic-key", alg: "RS256" }] });
});
async function token(changes: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: "synthetic-user", aud: "synthetic-project", iss: "https://securetoken.google.com/synthetic-project", iat: now - 1, auth_time: now - 10, exp: now + 60, ...changes }).setProtectedHeader({ alg: "RS256", kid: "synthetic-key" }).sign(privateKey);
}
describe("Firebase proxy verification (synthetic signed JWTs, no live credentials)", () => {
  it("accepts a correctly signed, current project identity", async () => {
    await expect(verifyUser(await token(), "synthetic-project")).resolves.toBeUndefined();
  });
  it.each([
    { aud: "other-project" }, { aud: ["synthetic-project"] }, { iss: "https://evil.example" }, { exp: 1 }, { iat: 9999999999 }, { iat: -1 },
    { auth_time: 9999999999 }, { auth_time: null }, { auth_time: -1 }, { sub: "" }, { sub: "x".repeat(129) },
  ])("rejects invalid required claims: %j", async claims => {
    await expect(verifyUser(await token(claims), "synthetic-project")).rejects.toThrow();
  });
  it("rejects altered signatures and emulator unsigned tokens", async () => {
    const signed = await token();
    await expect(verifyUser(signed, "synthetic-project")).resolves.toBeUndefined();
    const parts = signed.split(".");
    const originalSignature = parts[2];
    const signature = Buffer.from(originalSignature, "base64url");
    expect(signature.length).toBeGreaterThan(0);
    // Replacing a character with "x" can leave a valid signature unchanged.
    // Flip an actual byte bit, then re-encode valid base64url without changing claims.
    signature[0] ^= 1;
    parts[2] = signature.toString("base64url");
    const tampered = parts.join(".");
    expect(parts[2]).not.toBe(originalSignature);
    expect(tampered).not.toBe(signed);
    expect(Buffer.from(parts[2], "base64url")).not.toEqual(Buffer.from(originalSignature, "base64url"));
    await expect(verifyUser(tampered, "synthetic-project")).rejects.toMatchObject({
      code: "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
    });
    await expect(verifyUser("eyJhbGciOiJub25lIn0.e30.", "synthetic-project")).rejects.toThrow();
  });
});
