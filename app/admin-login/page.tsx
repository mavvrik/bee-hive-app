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
  const configured = isAdminConfigured();

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-lock-icon">
          🔒
        </div>

        <p className="admin-eyebrow">
          The Hive Administration
        </p>

        <h1>Manager Access</h1>

        <p className="admin-description">
          Enter the manager password to open
          budgets, worker settings, center
          metrics, and dashboard controls.
        </p>

        {!configured && (
          <div className="admin-alert">
            Admin access is not configured yet.
            Add <strong>ADMIN_PASSWORD</strong>
            {" "}and ideally{" "}
            <strong>ADMIN_SESSION_SECRET</strong>
            {" "}to your environment variables.
          </div>
        )}

        {error === "invalid" && (
          <div className="admin-alert error">
            The password was not accepted.
          </div>
        )}

        {error === "configuration" && (
          <div className="admin-alert error">
            Admin authentication must be
            configured before you can sign in.
          </div>
        )}

        <form action={loginAdmin}>
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

        <Link href="/" className="return-link">
          ← Return to The Hive
        </Link>
      </section>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .admin-login-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(255,221,102,.30), transparent 30%),
            linear-gradient(180deg,#fbf8ee 0%,#eee4c6 100%);
          font-family: Arial, sans-serif;
        }
        .admin-login-card {
          width: min(100%, 480px);
          padding: 34px;
          border: 1px solid #dfc36c;
          border-radius: 24px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 20px 50px rgba(77,56,9,.16);
        }
        .admin-lock-icon {
          display: grid;
          width: 64px;
          height: 64px;
          place-items: center;
          margin-bottom: 20px;
          border: 1px solid #e1bd42;
          border-radius: 18px;
          background: linear-gradient(135deg,#fff6c7,#ffe071);
          font-size: 1.9rem;
        }
        .admin-eyebrow {
          margin: 0 0 8px;
          color: #9c6d0a;
          font-size: .72rem;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          color: #3d2a07;
          font-size: clamp(2rem,7vw,3rem);
        }
        .admin-description {
          margin: 14px 0 24px;
          color: #71633e;
          line-height: 1.55;
        }
        .admin-alert {
          margin-bottom: 18px;
          padding: 13px 14px;
          border: 1px solid #e2c45e;
          border-radius: 12px;
          background: #fff7d5;
          color: #684b08;
          font-size: .88rem;
          line-height: 1.45;
        }
        .admin-alert.error {
          border-color: #e8a0a0;
          background: #fff0f0;
          color: #8b2525;
        }
        form { display: grid; gap: 10px; }
        label {
          color: #4b380c;
          font-size: .82rem;
          font-weight: 900;
        }
        input {
          width: 100%;
          padding: 14px 15px;
          border: 1px solid #d9c47c;
          border-radius: 12px;
          background: #fffef9;
          font: inherit;
        }
        input:focus {
          outline: 3px solid rgba(221,167,26,.18);
          border-color: #c9900b;
        }
        button {
          margin-top: 5px;
          padding: 14px 16px;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg,#4b3406,#805b08);
          color: white;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        button:disabled,
        input:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .return-link {
          display: inline-block;
          margin-top: 22px;
          color: #8d650d;
          font-size: .88rem;
          font-weight: 800;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
