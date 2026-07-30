import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateHiveMetrics } from "./actions";

export const dynamic = "force-dynamic";

export default async function HiveSettingsPage() {
  const settings =
    await prisma.hiveSettings.findUnique({
      where: { id: 1 },
    });

  if (!settings) {
    throw new Error(
      "Hive settings record 1 was not found.",
    );
  }

  return (
    <main className="hive-settings-page">
      <div className="hive-settings-shell">
        <Link href="/settings" className="back-link">
          ← Return to Administration
        </Link>

        <header className="page-header">
          <div>
            <p>Center Metrics & Display</p>
            <h1>Hive Configuration</h1>
            <span>
              Store the values that will power the
              future Center Health dashboard and
              control its rotation timing.
            </span>
          </div>
          <div className="header-icon">⚙️</div>
        </header>

        <form
          action={updateHiveMetrics}
          className="settings-form"
        >
          <section className="form-section">
            <div className="section-heading">
              <div>
                <p>Center Health Metrics</p>
                <h2>Manual dashboard values</h2>
              </div>
              <span>Saved to HiveSettings</span>
            </div>

            <div className="field-grid">
              <label>
                <span>Donor Frequency</span>
                <small>
                  Example: 1.68
                </small>
                <input
                  name="donorFrequency"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    settings.donorFrequency
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Current Theoretical Yield
                </span>
                <small>
                  Enter as a percent, such as 96.4
                </small>
                <div className="input-suffix-wrap">
                  <input
                    name="theoreticalYield"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={
                      settings.theoreticalYield
                    }
                    required
                  />
                  <strong>%</strong>
                </div>
              </label>

              <label>
                <span>Unique Donor Count</span>
                <small>
                  Whole-number donor count
                </small>
                <input
                  name="uniqueDonorCount"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={
                    settings.uniqueDonorCount
                  }
                  required
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <div>
                <p>Dashboard Display</p>
                <h2>Rotation timing</h2>
              </div>
              <span>Used in Phase 2</span>
            </div>

            <label className="rotation-field">
              <span>
                Seconds before changing views
              </span>
              <small>
                The agreed two-minute rotation is
                120 seconds. Minimum: 30 seconds.
              </small>
              <input
                name="dashboardRotationSeconds"
                type="number"
                min="30"
                step="1"
                defaultValue={
                  settings.dashboardRotationSeconds
                }
                required
              />
            </label>
          </section>

          <div className="form-actions">
            <Link href="/settings">
              Cancel
            </Link>
            <button type="submit">
              Save Hive Configuration
            </button>
          </div>
        </form>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .hive-settings-page {
          min-height: 100vh;
          padding: 38px 24px;
          background:
            radial-gradient(circle at top right,rgba(255,221,102,.27),transparent 28%),
            linear-gradient(180deg,#fbf8ee 0%,#f1ead3 100%);
          font-family: Arial,sans-serif;
        }
        .hive-settings-shell {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
        }
        .back-link {
          display: inline-flex;
          margin-bottom: 22px;
          color: #7d5c0a;
          font-size: .92rem;
          font-weight: 900;
          text-decoration: none;
        }
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
          padding: 27px 30px;
          border: 1px solid #dfc36c;
          border-radius: 22px;
          background: linear-gradient(135deg,#fff,#fff5c7);
          box-shadow: 0 14px 34px rgba(90,63,8,.11);
        }
        .page-header p,
        .section-heading p {
          margin: 0 0 7px;
          color: #9f700a;
          font-size: .7rem;
          font-weight: 900;
          letter-spacing: .14em;
          text-transform: uppercase;
        }
        .page-header h1 {
          margin: 0;
          color: #3d2a07;
          font-size: clamp(2rem,5vw,3.1rem);
          line-height: 1;
        }
        .page-header span {
          display: block;
          max-width: 690px;
          margin-top: 12px;
          color: #71633e;
          line-height: 1.5;
        }
        .header-icon {
          display: grid;
          width: 72px;
          height: 72px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid #ddb63b;
          border-radius: 20px;
          background: #ffec9c;
          font-size: 2rem;
        }
        .settings-form {
          display: grid;
          gap: 18px;
        }
        .form-section {
          padding: 25px;
          border: 1px solid #e3cd83;
          border-radius: 20px;
          background: rgba(255,255,255,.97);
          box-shadow: 0 10px 26px rgba(77,56,9,.07);
        }
        .section-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee2b8;
        }
        .section-heading h2 {
          margin: 0;
          color: #3d2a07;
          font-size: 1.35rem;
        }
        .section-heading > span {
          padding: 6px 10px;
          border-radius: 999px;
          background: #fff0b8;
          color: #835900;
          font-size: .67rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .field-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 18px;
        }
        label {
          display: grid;
          gap: 7px;
        }
        label > span {
          color: #49350b;
          font-size: .84rem;
          font-weight: 900;
        }
        label small {
          min-height: 34px;
          color: #7b6c47;
          font-size: .75rem;
          line-height: 1.4;
        }
        input {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #dbc77f;
          border-radius: 11px;
          background: #fffef9;
          color: #302204;
          font: inherit;
          font-weight: 800;
        }
        input:focus {
          outline: 3px solid rgba(221,167,26,.17);
          border-color: #c9900b;
        }
        .input-suffix-wrap {
          position: relative;
        }
        .input-suffix-wrap input {
          padding-right: 42px;
        }
        .input-suffix-wrap strong {
          position: absolute;
          top: 50%;
          right: 14px;
          color: #8b650c;
          transform: translateY(-50%);
        }
        .rotation-field {
          max-width: 420px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 3px 0 20px;
        }
        .form-actions a,
        .form-actions button {
          padding: 13px 18px;
          border-radius: 11px;
          font: inherit;
          font-weight: 900;
          text-decoration: none;
        }
        .form-actions a {
          border: 1px solid #d9c47c;
          background: white;
          color: #72530c;
        }
        .form-actions button {
          border: 0;
          background: linear-gradient(135deg,#4b3406,#805b08);
          color: white;
          cursor: pointer;
        }
        @media (max-width: 760px) {
          .hive-settings-page { padding: 24px 15px; }
          .page-header { align-items: flex-start; padding: 22px; }
          .header-icon { width: 56px; height: 56px; }
          .field-grid { grid-template-columns: 1fr; }
          .section-heading { flex-direction: column; }
          label small { min-height: auto; }
        }
      `}</style>
    </main>
  );
}
