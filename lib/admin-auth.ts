import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "hive_admin_session";
const ADMIN_SESSION_VALUE = "hive-admin-authenticated";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    getAdminPassword()
  );
}

function createSessionToken() {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  return crypto
    .createHmac("sha256", secret)
    .update(ADMIN_SESSION_VALUE)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    leftBuffer,
    rightBuffer,
  );
}

export function isAdminConfigured() {
  return Boolean(
    getAdminPassword() && getSessionSecret(),
  );
}

export function verifyAdminPassword(
  submittedPassword: string,
) {
  const configuredPassword =
    getAdminPassword();

  if (!configuredPassword) {
    return false;
  }

  return safeEqual(
    submittedPassword,
    configuredPassword,
  );
}

export async function createAdminSession() {
  const token = createSessionToken();

  if (!token) {
    throw new Error(
      "Admin authentication is not configured.",
    );
  }

  const cookieStore = await cookies();

  cookieStore.set(
    ADMIN_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  );
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const expectedToken = createSessionToken();

  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const actualToken =
    cookieStore.get(
      ADMIN_COOKIE_NAME,
    )?.value ?? "";

  if (!actualToken) {
    return false;
  }

  return safeEqual(
    actualToken,
    expectedToken,
  );
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin-login");
  }
}
