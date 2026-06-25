const COOKIE_NAME = "lord_manor_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlToBytes(value) {
  const base64 = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function deriveEncryptionKey(secret) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(secret)
  );

  return crypto.subtle.importKey(
    "raw",
    digest,
    {
      name: "AES-GCM"
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function hashText(value) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      textEncoder.encode(value)
    )
  );
}

function constantTimeEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < first.length; index += 1) {
    difference |= first[index] ^ second[index];
  }

  return difference === 0;
}

export async function passwordMatches(inputPassword, storedPassword) {
  if (
    typeof inputPassword !== "string" ||
    typeof storedPassword !== "string"
  ) {
    return false;
  }

  const [inputHash, storedHash] = await Promise.all([
    hashText(inputPassword),
    hashText(storedPassword)
  ]);

  return constantTimeEqual(inputHash, storedHash);
}

export async function createSessionCookie(env) {
  if (!env.MANOR_SESSION_SECRET) {
    throw new Error("MANOR_SESSION_SECRET is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    authenticated: true,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_SECONDS,
    version: 1
  };

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(
    env.MANOR_SESSION_SECRET
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      textEncoder.encode(JSON.stringify(payload))
    )
  );

  const value = [
    bytesToBase64Url(iv),
    bytesToBase64Url(encrypted)
  ].join(".");

  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict"
  ].join("; ");
}

export function createExpiredSessionCookie() {
  return [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict"
  ].join("; ");
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = cookie
      .slice(0, separatorIndex)
      .trim();

    const cookieValue = cookie
      .slice(separatorIndex + 1)
      .trim();

    if (cookieName === name) {
      return cookieValue;
    }
  }

  return null;
}

export async function readSession(request, env) {
  const value = readCookie(request, COOKIE_NAME);

  if (!value || !env.MANOR_SESSION_SECRET) {
    return null;
  }

  const parts = value.split(".");

  if (parts.length !== 2) {
    return null;
  }

  try {
    const iv = base64UrlToBytes(parts[0]);
    const encrypted = base64UrlToBytes(parts[1]);

    const key = await deriveEncryptionKey(
      env.MANOR_SESSION_SECRET
    );

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      encrypted
    );

    const payload = JSON.parse(
      textDecoder.decode(decrypted)
    );

    const now = Math.floor(Date.now() / 1000);

    if (
      payload.authenticated !== true ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= now ||
      payload.version !== 1
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireSession(context) {
  const session = await readSession(
    context.request,
    context.env
  );

  if (!session) {
    return new Response(
      JSON.stringify({
        error: "Authentication required."
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }

  return null;
}

export function hasValidSameOrigin(request) {
  const origin = request.headers.get("Origin");

  if (!origin) {
    return false;
  }

  const requestUrl = new URL(request.url);

  return origin === requestUrl.origin;
}
