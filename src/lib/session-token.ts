import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "nim_session";
export const SESSION_DAYS = 7;

function key(secret: string | undefined): Uint8Array {
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (16+ chars)");
    return new TextEncoder().encode("dev-only-session-secret-not-for-production");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: number, secret = process.env.SESSION_SECRET): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key(secret));
}

export async function verifySession(token: string | undefined, secret = process.env.SESSION_SECRET): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
