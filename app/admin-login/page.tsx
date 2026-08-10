import Link from "next/link";
import { redirect } from "next/navigation";
import {
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin-auth";
import { loginAdmin } from "./actions";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/settings");
  }

  const { error } = await searchParams;

  const configured =
    isAdminConfigured();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div
          className="admin-lock"
          aria-hidden="true"
        >
          🔒
        </div>

        <p className="admin-eyebrow">
          The Hive Administration
        </p>

        <h1>Manager Access</h1>

        <p className="admin-description">
          Enter the manager password to
          open budgets, worker settings,
          center metrics, and dashboard
          controls.
        </p>

        {!configured && (
          <div className="admin-alert">
            Admin access is not configured
            yet. Add{" "}
            <strong>
              ADMIN_PASSWORD
            </strong>{" "}
            to your environment variables.
          </div>
        )}

        {error === "invalid" && (
          <div className="admin-alert error">
            The password was not accepted.
          </div>
        )}

        {error ===
          "configuration" && (
          <div className="admin-alert error">
            Admin authentication must be
            configured before you can sign
            in.
          </div>
        )}

        <form
          action={loginAdmin}
          className="admin-login-form"
        >
          <label htmlFor="password">
            Manager password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            disabled={!configured}
          />

          <button
            type="submit"
            disabled={!configured}
          >
            Unlock Administration
          </button>
        </form>

        <Link
          href="/"
          className="return-link"
        >
          ← Return to The Hive
        </Link>
      </section>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .admin-login-page {
            min-height: 100vh;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 24px;

            background:
              linear-gradient(
                180deg,
                #fff9e8 0%,
                #f3df96 100%
              );

            font-family:
              Arial,
              sans-serif;
          }

          .admin-login-card {
            width: 100%;
            max-width: 460px;

            padding: 34px;

            border:
              1px solid #dfc36c;

            border-radius: 24px;

            background:
              rgba(
                255,
                255,
                255,
                0.98
              );

            box-shadow:
              0 16px 40px
              rgba(
                71,
                51,
                8,
                0.14
              );
          }

          .admin-lock {
            display: grid;
            place-items: center;

            width: 58px;
            height: 58px;

            margin-bottom: 18px;

            border-radius: 18px;

            background:
              #fff0ae;

            font-size: 1.8rem;
          }

          .admin-eyebrow {
            margin: 0 0 6px;

            color: #9b6c09;

            font-size: 0.7rem;
            font-weight: 900;

            letter-spacing:
              0.14em;

            text-transform:
              uppercase;
          }

          .admin-login-card h1 {
            margin:
              0 0 10px;

            color: #3d2a07;

            font-size: 2rem;
          }

          .admin-description {
            margin:
              0 0 22px;

            color: #726344;

            line-height: 1.5;
          }

          .admin-alert {
            margin-bottom: 16px;

            padding:
              12px 14px;

            border:
              1px solid #e2c96f;

            border-radius: 10px;

            background:
              #fff5c9;

            color: #6a520e;

            font-size: 0.86rem;
            line-height: 1.4;
          }

          .admin-alert.error {
            border-color:
              #dcaaaa;

            background:
              #fff0f0;

            color: #963636;
          }

          .admin-login-form {
            display: grid;
            gap: 10px;
          }

          .admin-login-form label {
            color: #594716;

            font-size: 0.8rem;
            font-weight: 900;
          }

          .admin-login-form input {
            width: 100%;
            height: 48px;

            padding:
              10px 13px;

            border:
              1px solid #d3bb67;

            border-radius: 10px;

            background: #ffffff;

            color: #111111;

            caret-color:
              #111111;

            font-family:
              Arial,
              sans-serif;

            font-size: 18px;

            font-weight: 700;

            letter-spacing:
              0.08em;

            -webkit-text-fill-color:
              #111111;

            -webkit-appearance:
              none;

            appearance:
              none;

            outline: none;
          }

          .admin-login-form input:focus {
            border-color:
              #c79208;

            box-shadow:
              0 0 0 3px
              rgba(
                212,
                160,
                23,
                0.18
              );
          }

          .admin-login-form input:disabled {
            background:
              #ededed;

            color: #777777;

            -webkit-text-fill-color:
              #777777;

            cursor:
              not-allowed;
          }

          .admin-login-form button {
            height: 46px;

            margin-top: 6px;

            border: none;
            border-radius: 10px;

            background:
              linear-gradient(
                135deg,
                #d4a017,
                #a97400
              );

            color: white;

            font-size: 0.95rem;
            font-weight: 900;

            cursor: pointer;
          }

          .admin-login-form button:disabled {
            opacity: 0.5;

            cursor:
              not-allowed;
          }

          .return-link {
            display: inline-block;

            margin-top: 20px;

            color: #805b00;

            font-size: 0.85rem;
            font-weight: 800;

            text-decoration: none;
          }
        `}
      </style>
    </main>
  );
}