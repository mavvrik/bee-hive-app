import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME =
  "hive_admin_session";

const SESSION_DURATION_SECONDS =
  60 * 60 * 8;

/*
 * ------------------------------------------------------
 * MANAGER PASSWORD
 * ------------------------------------------------------
 */

function getAdminPassword(): string {
  const password =
    process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is not configured in the environment.",
    );
  }

  return password;
}

/*
 * ------------------------------------------------------
 * SESSION SECRET
 * ------------------------------------------------------
 *
 * ADMIN_SESSION_SECRET is preferred.
 *
 * If one has not been configured, The Hive derives a
 * stable signing secret from ADMIN_PASSWORD.
 *
 * This prevents the manager login form from becoming
 * unusable simply because the optional session secret
 * is missing.
 */

function getSessionSecret(): string {
  const configuredSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (
    configuredSecret &&
    configuredSecret.trim() !== ""
  ) {
    return configuredSecret;
  }

  const password =
    getAdminPassword();

  return crypto
    .createHash("sha256")
    .update(
      `the-hive-admin-session:${password}`,
    )
    .digest("hex");
}

/*
 * ------------------------------------------------------
 * SESSION SIGNATURE
 * ------------------------------------------------------
 */

function createSignature(
  expiresAt: number,
): string {
  return crypto
    .createHmac(
      "sha256",
      getSessionSecret(),
    )
    .update(String(expiresAt))
    .digest("hex");
}

/*
 * ------------------------------------------------------
 * SESSION CREATION
 * ------------------------------------------------------
 */

function createSessionValue(): string {
  const expiresAt =
    Math.floor(Date.now() / 1000) +
    SESSION_DURATION_SECONDS;

  const signature =
    createSignature(expiresAt);

  return `${expiresAt}.${signature}`;
}

/*
 * ------------------------------------------------------
 * SESSION VALIDATION
 * ------------------------------------------------------
 */

function isValidSessionValue(
  sessionValue: string | undefined,
): boolean {
  if (!sessionValue) {
    return false;
  }

  const [
    expiresAtText,
    suppliedSignature,
  ] = sessionValue.split(".");

  if (
    !expiresAtText ||
    !suppliedSignature
  ) {
    return false;
  }

  const expiresAt =
    Number(expiresAtText);

  if (
    !Number.isFinite(expiresAt)
  ) {
    return false;
  }

  const currentTime =
    Math.floor(Date.now() / 1000);

  if (
    expiresAt <= currentTime
  ) {
    return false;
  }

  const expectedSignature =
    createSignature(expiresAt);

  const suppliedBuffer =
    Buffer.from(
      suppliedSignature,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8",
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    suppliedBuffer,
    expectedBuffer,
  );
}

/*
 * ------------------------------------------------------
 * PASSWORD VERIFICATION
 * ------------------------------------------------------
 */

export function verifyAdminPassword(
  suppliedPassword: string,
): boolean {
  const expectedPassword =
    getAdminPassword();

  const suppliedBuffer =
    Buffer.from(
      suppliedPassword,
      "utf8",
    );

  const expectedBuffer =
    Buffer.from(
      expectedPassword,
      "utf8",
    );

  if (
    suppliedBuffer.length !==
    expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    suppliedBuffer,
    expectedBuffer,
  );
}

/*
 * ------------------------------------------------------
 * CREATE AUTHENTICATED SESSION
 * ------------------------------------------------------
 */

export async function createAdminSession(): Promise<void> {
  const cookieStore =
    await cookies();

  cookieStore.set(
    ADMIN_COOKIE_NAME,
    createSessionValue(),
    {
      httpOnly: true,
      sameSite: "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      path: "/",

      maxAge:
        SESSION_DURATION_SECONDS,
    },
  );
}

/*
 * ------------------------------------------------------
 * LOGOUT
 * ------------------------------------------------------
 */

export async function clearAdminSession(): Promise<void> {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    ADMIN_COOKIE_NAME,
  );
}

/*
 * ------------------------------------------------------
 * AUTHENTICATION CHECK
 * ------------------------------------------------------
 */

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore =
    await cookies();

  const sessionValue =
    cookieStore.get(
      ADMIN_COOKIE_NAME,
    )?.value;

  return isValidSessionValue(
    sessionValue,
  );
}

/*
 * ------------------------------------------------------
 * CONFIGURATION CHECK
 * ------------------------------------------------------
 *
 * Only ADMIN_PASSWORD is required.
 *
 * ADMIN_SESSION_SECRET remains recommended,
 * but its absence will no longer disable
 * Manager Access.
 */

export function isAdminConfigured(): boolean {
  const password =
    process.env.ADMIN_PASSWORD;

  return Boolean(
    password &&
      password.trim() !== "",
  );
}