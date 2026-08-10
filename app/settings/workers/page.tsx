import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminShell from "../components/AdminShell";
import WorkerPhotoUpload from "./WorkerPhotoUpload";
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

  const meetTheBeesCollectors =
    activeCollectors.filter(
      (collector) =>
        collector.showOnMeetTheBees,
    );

  const employeeOfMonth =
    activeCollectors.find(
      (collector) =>
        collector.isEmployeeOfMonth,
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
    <AdminShell
      pageTitle="Worker Bees"
      pageDescription="Manage the Riviera Beach team, Meet the Bees profiles, recognition, and worker visibility."
      activePath="/settings/workers"
    >
      <section className="roster-summary">
        <article className="summary-card">
          <span>
            Active Worker Bees
          </span>

          <strong>
            {activeCollectors.length}
          </strong>

          <small>
            Current active team
          </small>
        </article>

        <article className="summary-card">
          <span>
            Meet the Bees
          </span>

          <strong>
            {
              meetTheBeesCollectors.length
            }
          </strong>

          <small>
            Profiles visible on TV
          </small>
        </article>

        <article className="summary-card featured">
          <span>
            Employee of the Month
          </span>

          <strong className="featured-name">
            {employeeOfMonth
              ? employeeOfMonth
                  .preferredName ||
                employeeOfMonth.name
              : "Not Selected"}
          </strong>

          <small>
            Featured recognition
          </small>
        </article>

        <article className="summary-card">
          <span>
            Inactive Records
          </span>

          <strong>
            {inactiveCollectors.length}
          </strong>

          <small>
            Retained for history
          </small>
        </article>
      </section>

      <section className="performance-banner">
        <div>
          <p className="section-eyebrow">
            Worker Performance
          </p>

          <h2>
            Stick Performance
          </h2>

          <p>
            Individual Worker Bees are
            measured using total sticks
            and successful sticks. Liters
            remain a center-level
            production metric.
          </p>
        </div>

        <Link
          href="/settings/workers/performance"
          className="performance-button"
        >
          View Stick Performance →
        </Link>
      </section>

      <section className="add-worker-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">
              New Hire
            </p>

            <h2>
              Add Worker Bee
            </h2>
          </div>

          <span className="section-badge">
            Roster Management
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
              placeholder="Worker bee name"
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
            <span>
              Display Order
            </span>

            <input
              type="number"
              name="position"
              min="1"
              step="1"
              defaultValue={
                nextPosition
              }
              required
            />
          </label>

          <label className="checkbox-field add-active">
            <input
              type="checkbox"
              name="active"
              defaultChecked
            />

            <span>
              Active Worker Bee
            </span>
          </label>

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
              Worker Bee Profiles
            </h2>
          </div>

          <span className="section-badge">
            {activeCollectors.length}{" "}
            Active
          </span>
        </div>

        {activeCollectors.length >
        0 ? (
          <div className="worker-grid">
            {activeCollectors.map(
              (collector) => {
                const displayName =
                  collector
                    .preferredName ||
                  collector.name;

                return (
                  <article
                    key={collector.id}
                    className={`worker-card ${
                      collector.isEmployeeOfMonth
                        ? "employee-of-month"
                        : ""
                    }`}
                  >
                    <div className="worker-card-header">
                      <div className="worker-identity">
                        <div className="worker-avatar">
                          {collector.photoUrl ? (
                            <img
                              src={
                                collector.photoUrl
                              }
                              alt=""
                            />
                          ) : (
                            <span>
                              🐝
                            </span>
                          )}
                        </div>

                        <div>
                          <p>
                            {collector.profileTitle ||
                              collector.role}
                          </p>

                          <h3>
                            {displayName}
                          </h3>

                          {collector.preferredName &&
                            collector.preferredName !==
                              collector.name && (
                              <small>
                                {
                                  collector.name
                                }
                              </small>
                            )}
                        </div>
                      </div>

                      <div className="status-stack">
                        {collector.isEmployeeOfMonth && (
                          <span className="worker-status employee">
                            🏆 Employee of
                            the Month
                          </span>
                        )}

                        <span
                          className={`worker-status ${
                            collector.showOnMeetTheBees
                              ? "visible"
                              : "hidden"
                          }`}
                        >
                          {collector.showOnMeetTheBees
                            ? "Meet the Bees"
                            : "Profile Hidden"}
                        </span>
                      </div>
                    </div>

                    <form
                      action={
                        updateCollector
                      }
                      className="worker-form"
                    >
                      <input
                        type="hidden"
                        name="collectorId"
                        value={
                          collector.id
                        }
                      />

                      <div className="profile-section-label">
                        Roster Information
                      </div>

                      <div className="worker-form-grid">
                        <label className="form-field">
                          <span>
                            Full Name
                          </span>

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
                          <span>
                            Preferred Name
                          </span>

                          <input
                            type="text"
                            name="preferredName"
                            defaultValue={
                              collector.preferredName ??
                              ""
                            }
                            placeholder="Optional"
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

                        <label className="form-field">
                          <span>
                            Profile Title
                          </span>

                          <input
                            type="text"
                            name="profileTitle"
                            defaultValue={
                              collector.profileTitle ??
                              ""
                            }
                            placeholder="Example: Phlebotomy Pro"
                          />
                        </label>
                      </div>

                      <div className="profile-section-label profile-gap">
                        Meet the Bees Profile
                      </div>

                      <div className="profile-form-grid">
                        <div className="full-width">
  <WorkerPhotoUpload
    workerId={collector.id}
    workerName={
      collector.preferredName ||
      collector.name
    }
    initialPhotoUrl={
      collector.photoUrl
    }
  />
</div>

                        <label className="form-field full-width">
                          <span>
                            Short Bio
                          </span>

                          <textarea
                            name="bio"
                            defaultValue={
                              collector.bio ??
                              ""
                            }
                            placeholder="A short introduction for Meet the Bees..."
                            rows={3}
                          />
                        </label>

                        <label className="form-field full-width">
                          <span>
                            Fun Fact
                          </span>

                          <input
                            type="text"
                            name="funFact"
                            defaultValue={
                              collector.funFact ??
                              ""
                            }
                            placeholder="Something fun about this Worker Bee"
                          />
                        </label>

                        <label className="form-field full-width">
                          <span>
                            Recognition
                            Message
                          </span>

                          <textarea
                            name="recognitionMessage"
                            defaultValue={
                              collector.recognitionMessage ??
                              ""
                            }
                            placeholder="Optional recognition or Employee of the Month message..."
                            rows={2}
                          />
                        </label>
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

                          <span>
                            Active
                          </span>
                        </label>

                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            name="showOnMeetTheBees"
                            defaultChecked={
                              collector.showOnMeetTheBees
                            }
                          />

                          <span>
                            Show on Meet the
                            Bees
                          </span>
                        </label>

                        <label className="checkbox-field employee-checkbox">
                          <input
                            type="checkbox"
                            name="isEmployeeOfMonth"
                            defaultChecked={
                              collector.isEmployeeOfMonth
                            }
                          />

                          <span>
                            🏆 Employee of the
                            Month
                          </span>
                        </label>
                      </div>

                      <div className="worker-actions">
                        <button
                          type="submit"
                          className="save-button"
                        >
                          Save Profile
                        </button>
                      </div>
                    </form>

                    <form
                      action={
                        deactivateCollector
                      }
                      className="deactivate-form"
                    >
                      <input
                        type="hidden"
                        name="collectorId"
                        value={
                          collector.id
                        }
                      />

                      <button
                        type="submit"
                        className="deactivate-button"
                      >
                        Deactivate Worker
                        Bee
                      </button>
                    </form>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span>🐝</span>

            <h3>
              No active worker bees
            </h3>

            <p>
              Add the first Worker Bee
              using the form above.
            </p>
          </div>
        )}
      </section>

      {inactiveCollectors.length >
        0 && (
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
              {
                inactiveCollectors.length
              }{" "}
              Inactive
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
                      {
                        collector.preferredName ||
                        collector.name
                      }
                    </strong>

                    <span>
                      {collector.role}
                    </span>
                  </div>

                  <form
                    action={
                      reactivateCollector
                    }
                  >
                    <input
                      type="hidden"
                      name="collectorId"
                      value={
                        collector.id
                      }
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

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .roster-summary {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
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
            background: rgba(255,255,255,.96);
            box-shadow:
              0 8px 20px
              rgba(75,54,10,.07);
          }

          .summary-card.featured {
            background:
              linear-gradient(
                145deg,
                #fff8d9,
                #ffe89a
              );
            border-color: #d6a318;
          }

          .summary-card span {
            color: #806719;
            font-size: .73rem;
            font-weight: 900;
            letter-spacing: .06em;
            text-transform: uppercase;
          }

          .summary-card strong {
            margin: 5px 0;
            color: #3b2906;
            font-size: 2rem;
          }

          .summary-card .featured-name {
            font-size: 1.25rem;
          }

          .summary-card small {
            color: #7a7157;
          }

          .performance-banner,
          .add-worker-section,
          .active-roster-section,
          .inactive-section {
            margin-bottom: 20px;
            padding: 24px;
            border: 1px solid #e0c675;
            border-radius: 22px;
            background: rgba(255,255,255,.96);
            box-shadow:
              0 10px 28px
              rgba(74,53,7,.08);
          }

          .performance-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            background:
              linear-gradient(
                135deg,
                #3b2a07,
                #6a4b08
              );
          }

          .performance-banner h2 {
            margin: 0 0 7px;
            color: #ffe48a;
          }

          .performance-banner p:not(.section-eyebrow) {
            max-width: 680px;
            margin: 0;
            color: #f5e8bd;
            line-height: 1.5;
          }

          .performance-banner .section-eyebrow {
            color: #e8c75c;
          }

          .performance-button {
            flex: 0 0 auto;
            padding: 11px 16px;
            border-radius: 10px;
            background: #e1aa19;
            color: #fff;
            font-size: .82rem;
            font-weight: 900;
            text-decoration: none;
          }

          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 20px;
          }

          .section-eyebrow {
            margin: 0 0 6px;
            color: #9b6c09;
            font-size: .68rem;
            font-weight: 900;
            letter-spacing: .15em;
            text-transform: uppercase;
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
            font-size: .7rem;
            font-weight: 900;
            letter-spacing: .05em;
            text-transform: uppercase;
          }

          .section-badge.inactive {
            background: #ececec;
            color: #666;
          }

          .add-worker-form {
            display: grid;
            grid-template-columns:
              2fr 1.4fr 1.2fr .8fr;
            gap: 14px;
            align-items: end;
          }

          .add-active {
            min-height: 42px;
          }

          .form-field {
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 6px;
          }

          .form-field > span,
          .profile-section-label {
            color: #5d4b1c;
            font-size: .72rem;
            font-weight: 900;
            letter-spacing: .04em;
            text-transform: uppercase;
          }

          .form-field input,
          .form-field select,
          .form-field textarea {
            width: 100%;
            min-width: 0;
            padding: 9px 11px;
            border: 1px solid #d8c47a;
            border-radius: 9px;
            background: white;
            color: #332606;
            font-family: inherit;
            font-size: .92rem;
            font-weight: 700;
            outline: none;
          }

          .form-field input,
          .form-field select {
            height: 42px;
          }

          .form-field textarea {
            min-height: 72px;
            resize: vertical;
            line-height: 1.4;
          }

          .form-field input:focus,
          .form-field select:focus,
          .form-field textarea:focus {
            border-color: #c88e00;
            box-shadow:
              0 0 0 3px
              rgba(214,161,14,.16);
          }

          .checkbox-field {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #58491f;
            font-size: .84rem;
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

          .worker-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          .worker-card {
            min-width: 0;
            padding: 18px;
            overflow: hidden;
            border: 1px solid #e1cb80;
            border-top: 4px solid #d7a216;
            border-radius: 18px;
            background:
              linear-gradient(
                180deg,
                #fff,
                #fffaf0
              );
          }

          .worker-card.employee-of-month {
            border-color: #d39a00;
            background:
              linear-gradient(
                180deg,
                #fff9db,
                #fff3b7
              );
            box-shadow:
              0 10px 26px
              rgba(181,128,0,.16);
          }

          .worker-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
          }

          .worker-identity {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 12px;
          }

          .worker-avatar {
            display: grid;
            flex: 0 0 auto;
            width: 58px;
            height: 58px;
            place-items: center;
            overflow: hidden;
            border: 1px solid #dfbd4d;
            border-radius: 16px;
            background: #fff0a2;
            font-size: 1.6rem;
          }

          .worker-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .worker-identity p {
            margin: 0 0 2px;
            color: #8b6e19;
            font-size: .66rem;
            font-weight: 900;
            letter-spacing: .07em;
            text-transform: uppercase;
          }

          .worker-identity h3 {
            margin: 0;
            color: #382807;
            font-size: 1.2rem;
          }

          .worker-identity small {
            display: block;
            margin-top: 3px;
            color: #887d62;
          }

          .status-stack {
            display: flex;
            align-items: flex-end;
            flex-direction: column;
            gap: 6px;
          }

          .worker-status {
            padding: 6px 9px;
            border-radius: 999px;
            font-size: .61rem;
            font-weight: 900;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .worker-status.visible {
            background: #e1f7e5;
            color: #29703a;
          }

          .worker-status.hidden {
            background: #ececec;
            color: #686868;
          }

          .worker-status.employee {
            background: #ffe486;
            color: #694900;
          }

          .profile-section-label {
            padding-bottom: 8px;
            border-bottom: 1px solid #eadba8;
          }

          .profile-gap {
            margin-top: 18px;
          }

          .worker-form-grid,
          .profile-form-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 12px;
          }

          .full-width {
            grid-column: 1 / -1;
          }

          .worker-options {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 20px;
            margin-top: 16px;
            padding: 13px;
            border: 1px solid #eadba8;
            border-radius: 12px;
            background: #fff9e7;
          }

          .employee-checkbox {
            color: #795500;
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
            font-size: .75rem;
            font-weight: 900;
            cursor: pointer;
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
            font-size: .78rem;
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

          @media (max-width: 1150px) {
            .roster-summary {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .add-worker-form {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .primary-button {
              grid-column: 1 / -1;
            }

            .worker-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 700px) {
            .roster-summary,
            .add-worker-form,
            .worker-form-grid,
            .profile-form-grid {
              grid-template-columns: 1fr;
            }

            .performance-banner,
            .section-heading,
            .worker-card-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .performance-button {
              width: 100%;
              text-align: center;
            }

            .full-width {
              grid-column: auto;
            }

            .status-stack {
              align-items: flex-start;
            }

            .worker-options {
              align-items: flex-start;
              flex-direction: column;
              gap: 10px;
            }
          }
        `}
      </style>
    </AdminShell>
  );
}