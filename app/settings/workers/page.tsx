import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  createCollector,
  deactivateCollector,
  reactivateCollector,
  updateCollector,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function WorkerRosterPage() {
  const collectors =
    await prisma.collector.findMany({
      orderBy: [
        {
          active: "desc",
        },
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const activeCollectors =
    collectors.filter(
      (collector) => collector.active,
    );

  const targetParticipants =
    activeCollectors.filter(
      (collector) =>
        collector.participatesInTarget,
    );

  const inactiveCollectors =
    collectors.filter(
      (collector) => !collector.active,
    );

  const nextPosition =
    collectors.length > 0
      ? Math.max(
          ...collectors.map(
            (collector) =>
              collector.position,
          ),
        ) + 1
      : 1;

  return (
    <main className="roster-page">
      <div className="roster-shell">
        <nav className="page-navigation">
          <Link
            href="/settings"
            className="back-link"
          >
            ← Hive Administration
          </Link>

          <Link
            href="/"
            className="dashboard-link"
          >
            Return to The Hive
          </Link>
        </nav>

        <header className="roster-header">
          <div>
            <p className="roster-eyebrow">
              Workforce Administration
            </p>

            <h1>Worker Bee Roster</h1>

            <p className="roster-description">
              Add worker bees, control target
              participation, update display
              order, and adjust individual
              weekly targets.
            </p>
          </div>

          <div className="header-icon">
            🐝
          </div>
        </header>

        <section className="roster-summary">
          <article className="summary-card">
            <span>Active Worker Bees</span>

            <strong>
              {activeCollectors.length}
            </strong>

            <small>
              Visible on the dashboard
            </small>
          </article>

          <article className="summary-card">
            <span>
              Target Participants
            </span>

            <strong>
              {targetParticipants.length}
            </strong>

            <small>
              Sharing the weekly target
            </small>
          </article>

          <article className="summary-card">
            <span>Inactive Records</span>

            <strong>
              {inactiveCollectors.length}
            </strong>

            <small>
              Retained for history
            </small>
          </article>
        </section>

        <section className="add-worker-section">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">
                New Hire
              </p>

              <h2>Add Worker Bee</h2>
            </div>

            <span className="section-badge">
              Ready for Ashley
            </span>
          </div>

          <form
            action={createCollector}
            className="add-worker-form"
          >
            <label className="form-field">
              <span>Name</span>

              <input
                type="text"
                name="name"
                placeholder="Ashley"
                required
              />
            </label>

            <label className="form-field">
              <span>Role</span>

              <select
                name="role"
                defaultValue="Phlebotomist"
                required
              >
                <option value="Phlebotomist">
                  Phlebotomist
                </option>

                <option value="Group Lead">
                  Group Lead
                </option>

                <option value="Management">
                  Management
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>

            <label className="form-field">
              <span>Group Type</span>

              <select
                name="groupType"
                defaultValue="Individual"
                required
              >
                <option value="Individual">
                  Individual
                </option>

                <option value="Group">
                  Group
                </option>
              </select>
            </label>

            <label className="form-field">
              <span>Display Order</span>

              <input
                type="number"
                name="position"
                min="1"
                step="1"
                defaultValue={nextPosition}
                required
              />
            </label>

            <div className="add-worker-options">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                />

                <span>
                  Active on dashboard
                </span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  name="participatesInTarget"
                  defaultChecked
                />

                <span>
                  Participates in weekly
                  target
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="primary-button"
            >
              + Add Worker Bee
            </button>
          </form>
        </section>

        <section className="active-roster-section">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">
                Active Team
              </p>

              <h2>
                Current Worker Bees
              </h2>
            </div>

            <span className="section-badge">
              {activeCollectors.length} Active
            </span>
          </div>

          {activeCollectors.length > 0 ? (
            <div className="worker-grid">
              {activeCollectors.map(
                (collector) => (
                  <article
                    key={collector.id}
                    className={`worker-card ${
                      collector.participatesInTarget
                        ? "target-worker"
                        : "support-worker"
                    }`}
                  >
                    <div className="worker-card-header">
                      <div className="worker-identity">
                        <div className="worker-avatar">
                          🐝
                        </div>

                        <div>
                          <p>
                            {collector.role}
                          </p>

                          <h3>
                            {collector.name}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`worker-status ${
                          collector.participatesInTarget
                            ? "participant"
                            : "support"
                        }`}
                      >
                        {collector.participatesInTarget
                          ? "Target Participant"
                          : "Support Role"}
                      </span>
                    </div>

                    <form
                      action={updateCollector}
                      className="worker-form"
                    >
                      <input
                        type="hidden"
                        name="collectorId"
                        value={collector.id}
                      />

                      <div className="worker-form-grid">
                        <label className="form-field">
                          <span>Name</span>

                          <input
                            type="text"
                            name="name"
                            defaultValue={
                              collector.name
                            }
                            required
                          />
                        </label>

                        <label className="form-field">
                          <span>Role</span>

                          <select
                            name="role"
                            defaultValue={
                              collector.role
                            }
                            required
                          >
                            <option value="Phlebotomist">
                              Phlebotomist
                            </option>

                            <option value="Group Lead">
                              Group Lead
                            </option>

                            <option value="Management">
                              Management
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </label>

                        <label className="form-field">
                          <span>
                            Group Type
                          </span>

                          <select
                            name="groupType"
                            defaultValue={
                              collector.groupType
                            }
                            required
                          >
                            <option value="Individual">
                              Individual
                            </option>

                            <option value="Group">
                              Group
                            </option>
                          </select>
                        </label>

                        <label className="form-field">
                          <span>
                            Display Order
                          </span>

                          <input
                            type="number"
                            name="position"
                            min="1"
                            step="1"
                            defaultValue={
                              collector.position
                            }
                            required
                          />
                        </label>
                      </div>

                      <div className="target-adjustment-panel">
                        <div>
                          <span className="adjustment-label">
                            Weekly Target
                            Adjustment
                          </span>

                          <small>
                            Use a negative number
                            to reduce the target or
                            a positive number to
                            increase it.
                          </small>
                        </div>

                        <div className="adjustment-input">
                          <input
                            type="number"
                            name="targetAdjustmentLiters"
                            step="0.01"
                            defaultValue={
                              collector.targetAdjustmentLiters
                            }
                            disabled={
                              !collector.participatesInTarget
                            }
                          />

                          <span>L</span>
                        </div>
                      </div>

                      <div className="worker-options">
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            name="active"
                            defaultChecked={
                              collector.active
                            }
                          />

                          <span>Active</span>
                        </label>

                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            name="participatesInTarget"
                            defaultChecked={
                              collector.participatesInTarget
                            }
                          />

                          <span>
                            Participates in
                            weekly target
                          </span>
                        </label>
                      </div>

                      <div className="worker-actions">
                        <button
                          type="submit"
                          className="save-button"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>

                    <form
                      action={deactivateCollector}
                      className="deactivate-form"
                    >
                      <input
                        type="hidden"
                        name="collectorId"
                        value={collector.id}
                      />

                      <button
                        type="submit"
                        className="deactivate-button"
                      >
                        Deactivate Worker Bee
                      </button>
                    </form>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div className="empty-state">
              <span>🐝</span>

              <h3>
                No active worker bees
              </h3>

              <p>
                Add the first worker bee
                using the form above.
              </p>
            </div>
          )}
        </section>

        {inactiveCollectors.length > 0 && (
          <section className="inactive-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">
                  Historical Records
                </p>

                <h2>
                  Inactive Worker Bees
                </h2>
              </div>

              <span className="section-badge inactive">
                {inactiveCollectors.length} Inactive
              </span>
            </div>

            <div className="inactive-list">
              {inactiveCollectors.map(
                (collector) => (
                  <article
                    key={collector.id}
                    className="inactive-card"
                  >
                    <div>
                      <strong>
                        {collector.name}
                      </strong>

                      <span>
                        {collector.role}
                      </span>
                    </div>

                    <form
                      action={reactivateCollector}
                    >
                      <input
                        type="hidden"
                        name="collectorId"
                        value={collector.id}
                      />

                      <button
                        type="submit"
                        className="reactivate-button"
                      >
                        Reactivate
                      </button>
                    </form>
                  </article>
                ),
              )}
            </div>
          </section>
        )}
      </div>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
          }

          .roster-page {
            min-height: 100vh;
            padding: 36px 24px 60px;
            background:
              radial-gradient(
                circle at top right,
                rgba(255, 215, 84, 0.24),
                transparent 30%
              ),
              linear-gradient(
                180deg,
                #fbf8ed,
                #f1ead2
              );
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .roster-shell {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
          }

          .page-navigation {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 22px;
          }

          .back-link,
          .dashboard-link {
            color: #795807;
            font-size: 0.9rem;
            font-weight: 800;
            text-decoration: none;
          }

          .back-link:hover,
          .dashboard-link:hover {
            color: #b17d00;
          }

          .roster-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 20px;
            padding: 28px 30px;
            border: 1px solid #dfc36c;
            border-radius: 24px;
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.98),
                rgba(255, 244, 195, 0.96)
              );
            box-shadow:
              0 14px 34px
              rgba(81, 57, 6, 0.11);
          }

          .roster-eyebrow,
          .section-eyebrow {
            margin: 0 0 6px;
            color: #9b6c09;
            font-size: 0.68rem;
            font-weight: 900;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .roster-header h1 {
            margin: 0;
            color: #3d2a07;
            font-size: clamp(
              2rem,
              4vw,
              3rem
            );
            line-height: 1;
          }

          .roster-description {
            max-width: 700px;
            margin: 12px 0 0;
            color: #746742;
            line-height: 1.55;
          }

          .header-icon {
            display: grid;
            flex: 0 0 auto;
            width: 82px;
            height: 82px;
            place-items: center;
            border: 1px solid #dca916;
            border-radius: 24px;
            background:
              linear-gradient(
                135deg,
                #fff8cb,
                #ffe168
              );
            font-size: 2.7rem;
          }

          .roster-summary {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 20px;
          }

          .summary-card {
            display: flex;
            min-height: 132px;
            flex-direction: column;
            justify-content: center;
            padding: 20px;
            border: 1px solid #e4cf89;
            border-radius: 18px;
            background: rgba(
              255,
              255,
              255,
              0.94
            );
            box-shadow:
              0 8px 20px
              rgba(75, 54, 10, 0.07);
          }

          .summary-card span {
            color: #806719;
            font-size: 0.73rem;
            font-weight: 900;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .summary-card strong {
            margin: 5px 0;
            color: #3b2906;
            font-size: 2rem;
          }

          .summary-card small {
            color: #7a7157;
          }

          .add-worker-section,
          .active-roster-section,
          .inactive-section {
            margin-bottom: 20px;
            padding: 24px;
            border: 1px solid #e0c675;
            border-radius: 22px;
            background: rgba(
              255,
              255,
              255,
              0.96
            );
            box-shadow:
              0 10px 28px
              rgba(74, 53, 7, 0.08);
          }

          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 20px;
          }

          .section-heading h2 {
            margin: 0;
            color: #3e2c08;
            font-size: 1.55rem;
          }

          .section-badge {
            padding: 7px 11px;
            border-radius: 999px;
            background: #fff0ae;
            color: #785300;
            font-size: 0.7rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .section-badge.inactive {
            background: #ececec;
            color: #666;
          }

          .add-worker-form {
            display: grid;
            grid-template-columns:
              2fr 1.4fr 1.2fr 0.8fr;
            gap: 14px;
            align-items: end;
          }

          .form-field {
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 6px;
          }

          .form-field > span,
          .adjustment-label {
            color: #5d4b1c;
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .form-field input,
          .form-field select,
          .adjustment-input input {
            width: 100%;
            min-width: 0;
            height: 42px;
            padding: 9px 11px;
            border: 1px solid #d8c47a;
            border-radius: 9px;
            background: white;
            color: #332606;
            font-size: 0.92rem;
            font-weight: 700;
            outline: none;
          }

          .form-field input:focus,
          .form-field select:focus,
          .adjustment-input input:focus {
            border-color: #c88e00;
            box-shadow:
              0 0 0 3px
              rgba(214, 161, 14, 0.16);
          }

          .add-worker-options {
            display: flex;
            grid-column: 1 / -2;
            align-items: center;
            gap: 24px;
            min-height: 42px;
          }

          .checkbox-field {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #58491f;
            font-size: 0.84rem;
            font-weight: 800;
            cursor: pointer;
          }

          .checkbox-field input {
            width: 17px;
            height: 17px;
            accent-color: #d29a0a;
          }

          .primary-button,
          .save-button,
          .reactivate-button {
            border: none;
            border-radius: 9px;
            background:
              linear-gradient(
                135deg,
                #d5a318,
                #b97e00
              );
            color: white;
            font-weight: 900;
            cursor: pointer;
          }

          .primary-button {
            height: 42px;
            padding: 0 18px;
          }

          .primary-button:hover,
          .save-button:hover,
          .reactivate-button:hover {
            filter: brightness(1.05);
          }

          .worker-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .worker-card {
            position: relative;
            min-width: 0;
            padding: 18px;
            overflow: hidden;
            border: 1px solid #e1cb80;
            border-radius: 18px;
            background:
              linear-gradient(
                180deg,
                #ffffff,
                #fffaf0
              );
          }

          .worker-card.target-worker {
            border-top:
              4px solid #d7a216;
          }

          .worker-card.support-worker {
            border-top:
              4px solid #777;
          }

          .worker-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 16px;
          }

          .worker-identity {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 11px;
          }

          .worker-avatar {
            display: grid;
            flex: 0 0 auto;
            width: 44px;
            height: 44px;
            place-items: center;
            border: 1px solid #dfbd4d;
            border-radius: 14px;
            background: #fff0a2;
            font-size: 1.45rem;
          }

          .worker-identity p {
            margin: 0 0 2px;
            color: #8b6e19;
            font-size: 0.66rem;
            font-weight: 900;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .worker-identity h3 {
            margin: 0;
            overflow: hidden;
            color: #382807;
            font-size: 1.2rem;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .worker-status {
            flex: 0 0 auto;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 0.61rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .worker-status.participant {
            background: #e1f7e5;
            color: #29703a;
          }

          .worker-status.support {
            background: #ececec;
            color: #686868;
          }

          .worker-form-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .target-adjustment-panel {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 14px;
            padding: 13px;
            border: 1px solid #eadba8;
            border-radius: 12px;
            background: #fff9e7;
          }

          .target-adjustment-panel small {
            display: block;
            max-width: 300px;
            margin-top: 4px;
            color: #83775a;
            font-size: 0.72rem;
            line-height: 1.35;
          }

          .adjustment-input {
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 7px;
          }

          .adjustment-input input {
            width: 100px;
          }

          .adjustment-input input:disabled {
            background: #eee;
            color: #888;
            cursor: not-allowed;
          }

          .adjustment-input span {
            color: #6c550f;
            font-weight: 900;
          }

          .worker-options {
            display: flex;
            align-items: center;
            gap: 22px;
            margin-top: 14px;
          }

          .worker-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
          }

          .save-button {
            padding: 10px 18px;
          }

          .deactivate-form {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee2bc;
            text-align: right;
          }

          .deactivate-button {
            border: none;
            background: transparent;
            color: #a23b32;
            font-size: 0.75rem;
            font-weight: 900;
            cursor: pointer;
          }

          .deactivate-button:hover {
            text-decoration: underline;
          }

          .inactive-list {
            display: grid;
            gap: 10px;
          }

          .inactive-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding: 14px 16px;
            border: 1px solid #ddd;
            border-radius: 12px;
            background: #f8f8f8;
          }

          .inactive-card > div {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .inactive-card strong {
            color: #444;
          }

          .inactive-card span {
            color: #7c7c7c;
            font-size: 0.78rem;
          }

          .reactivate-button {
            padding: 8px 14px;
          }

          .empty-state {
            padding: 40px;
            border: 1px dashed #d4bd72;
            border-radius: 16px;
            text-align: center;
          }

          .empty-state span {
            font-size: 2.5rem;
          }

          .empty-state h3 {
            margin: 10px 0 6px;
            color: #4b3508;
          }

          .empty-state p {
            margin: 0;
            color: #776d54;
          }

          @media (max-width: 980px) {
            .add-worker-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .add-worker-options {
              grid-column: 1 / -1;
            }

            .primary-button {
              grid-column: 1 / -1;
            }

            .worker-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .roster-page {
              padding: 22px 14px 40px;
            }

            .page-navigation,
            .roster-header,
            .section-heading,
            .worker-card-header,
            .target-adjustment-panel {
              align-items: flex-start;
              flex-direction: column;
            }

            .header-icon {
              width: 64px;
              height: 64px;
              font-size: 2rem;
            }

            .roster-summary,
            .add-worker-form,
            .worker-form-grid {
              grid-template-columns: 1fr;
            }

            .add-worker-options,
            .worker-options {
              align-items: flex-start;
              flex-direction: column;
              gap: 10px;
            }

            .worker-status {
              align-self: flex-start;
            }

            .adjustment-input {
              width: 100%;
            }

            .adjustment-input input {
              flex: 1;
              width: auto;
            }
          }
        `}
      </style>
    </main>
  );
}