import Link from "next/link";
import { prisma } from "@/lib/prisma";

import AdminShell from "../../components/AdminShell";

import {
  saveDailyWorkerPerformance,
} from "./actions";

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

const ROLE_LABELS: Record<
  string,
  string
> = {
  MANAGEMENT:
    "Management",

  PHLEBOTOMIST:
    "Phlebotomist",

  GROUP_LEAD:
    "Group Lead",

  PROCESSOR:
    "Processor",

  RECEPTION_TECH:
    "Reception Tech",

  MSA:
    "MSA",

  DST:
    "DST",

  OTHER:
    "Other",
};

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function parseSelectedDate(
  value: string,
) {
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return value;
  }

  return formatDateInput(
    new Date(),
  );
}

function dateFromInput(
  value: string,
) {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}

function getPrimaryRoleEnum(
  role: string,
) {
  switch (role) {
    case "Management":
      return "MANAGEMENT";

    case "Phlebotomist":
      return "PHLEBOTOMIST";

    case "Group Lead":
      return "GROUP_LEAD";

    case "Processor":
      return "PROCESSOR";

    case "Reception Tech":
      return "RECEPTION_TECH";

    case "MSA":
      return "MSA";

    case "DST":
      return "DST";

    default:
      return "OTHER";
  }
}

export default async function WorkerPerformancePage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    searchParams
      ? await searchParams
      : {};

  const selectedDate =
    parseSelectedDate(
      resolvedSearchParams.date ??
        "",
    );

  const entryDate =
    dateFromInput(
      selectedDate,
    );

  const collectors =
    await prisma.collector.findMany({
      where: {
        active: true,
      },

      include: {
        roleAssignments:
          true,

        stickEntries: {
          where: {
            entryDate,
          },

          take: 1,
        },

        performanceEntries: {
          where: {
            entryDate,
          },
        },

        emfEntries: {
          where: {
            entryDate,
          },

          take: 1,
        },
      },

      orderBy: [
        {
          position:
            "asc",
        },

        {
          name:
            "asc",
        },
      ],
    });

  return (
    <AdminShell
      pageTitle="Daily Worker Performance"
      pageDescription="Enter daily Worker Bee activity, stick performance, and Quality EMFs."
      activePath="/settings/workers/performance"
    >
      <section className="performance-toolbar">
        <div>
          <p className="section-eyebrow">
            Daily Performance
          </p>

          <h2>
            Activity Entry
          </h2>

          <p className="toolbar-description">
            Enter each Worker Bee&apos;s
            activity for the selected
            day. Cross-trained workers
            receive fields for every role
            they are eligible to perform.
          </p>
        </div>

        <form
          method="get"
          className="date-form"
        >
          <label>
            <span>
              Performance Date
            </span>

            <input
              type="date"
              name="date"
              defaultValue={
                selectedDate
              }
            />
          </label>

          <button type="submit">
            Load Date
          </button>
        </form>
      </section>

      <div className="toolbar-links">
        <Link
          href="/settings/workers"
        >
          ← Worker Bees
        </Link>

        <span>
          {collectors.length} active
          Worker Bees
        </span>
      </div>

      <section className="performance-grid">
        {collectors.map(
          (collector) => {
            const roleSet =
              new Set<string>();

            for (
              const assignment of
                collector.roleAssignments
            ) {
              roleSet.add(
                assignment.role,
              );
            }

            roleSet.add(
              getPrimaryRoleEnum(
                collector.role,
              ),
            );

            const stickEntry =
              collector
                .stickEntries[0];

            const emfEntry =
              collector.emfEntries[0];

            function metricValue(
              role: string,
              metric: string,
            ) {
              return (
                collector.performanceEntries.find(
                  (entry) =>
                    entry.role ===
                      role &&
                    entry.metric ===
                      metric,
                )?.totalCount ??
                0
              );
            }

            const roles =
              Array.from(
                roleSet,
              );

            return (
              <article
                key={
                  collector.id
                }
                className="worker-performance-card"
              >
                <header className="worker-card-header">
                  <div>
                    <p>
                      {
                        collector.role
                      }
                    </p>

                    <h3>
                      {collector.preferredName ||
                        collector.name}
                    </h3>

                    <small>
                      Primary Role
                    </small>
                  </div>

                  <div className="role-pills">
                    {roles.map(
                      (role) => (
                        <span
                          key={
                            role
                          }
                        >
                          {ROLE_LABELS[
                            role
                          ] ??
                            role}
                        </span>
                      ),
                    )}
                  </div>
                </header>

                <form
                  action={
                    saveDailyWorkerPerformance
                  }
                  className="entry-form"
                >
                  <input
                    type="hidden"
                    name="collectorId"
                    value={
                      collector.id
                    }
                  />

                  <input
                    type="hidden"
                    name="entryDate"
                    value={
                      selectedDate
                    }
                  />

                  {roleSet.has(
                    "PHLEBOTOMIST",
                  ) && (
                    <section className="activity-group">
                      <div className="activity-heading">
                        <strong>
                          Phlebotomy
                        </strong>

                        <span>
                          Stick Performance
                        </span>
                      </div>

                      <div className="field-grid">
                        <label className="form-field">
                          <span>
                            Total Sticks
                          </span>

                          <input
                            type="number"
                            name="totalSticks"
                            min="0"
                            step="1"
                            defaultValue={
                              stickEntry
                                ?.totalSticks ??
                              0
                            }
                          />
                        </label>

                        <label className="form-field">
                          <span>
                            Successful
                            Sticks
                          </span>

                          <input
                            type="number"
                            name="successfulSticks"
                            min="0"
                            step="1"
                            defaultValue={
                              stickEntry
                                ?.successfulSticks ??
                              0
                            }
                          />
                        </label>
                      </div>
                    </section>
                  )}

                  {roleSet.has(
                    "MSA",
                  ) && (
                    <section className="activity-group">
                      <div className="activity-heading">
                        <strong>
                          MSA
                        </strong>

                        <span>
                          Medical
                          Assessment
                        </span>
                      </div>

                      <div className="field-grid single">
                        <label className="form-field">
                          <span>
                            Physicals
                          </span>

                          <input
                            type="number"
                            name="physicals"
                            min="0"
                            step="1"
                            defaultValue={metricValue(
                              "MSA",
                              "PHYSICALS",
                            )}
                          />
                        </label>
                      </div>
                    </section>
                  )}

                  {roleSet.has(
                    "RECEPTION_TECH",
                  ) && (
                    <section className="activity-group">
                      <div className="activity-heading">
                        <strong>
                          Reception Tech
                        </strong>

                        <span>
                          Donor Intake
                        </span>
                      </div>

                      <div className="field-grid single">
                        <label className="form-field">
                          <span>
                            Interviews
                          </span>

                          <input
                            type="number"
                            name="interviews"
                            min="0"
                            step="1"
                            defaultValue={metricValue(
                              "RECEPTION_TECH",
                              "INTERVIEWS",
                            )}
                          />
                        </label>
                      </div>
                    </section>
                  )}

                  {roleSet.has(
                    "DST",
                  ) && (
                    <section className="activity-group">
                      <div className="activity-heading">
                        <strong>
                          DST
                        </strong>

                        <span>
                          Setup /
                          Disconnect
                        </span>
                      </div>

                      <div className="field-grid">
                        <label className="form-field">
                          <span>
                            Setups
                          </span>

                          <input
                            type="number"
                            name="setups"
                            min="0"
                            step="1"
                            defaultValue={metricValue(
                              "DST",
                              "SETUPS",
                            )}
                          />
                        </label>

                        <label className="form-field">
                          <span>
                            Disconnects
                          </span>

                          <input
                            type="number"
                            name="disconnects"
                            min="0"
                            step="1"
                            defaultValue={metricValue(
                              "DST",
                              "DISCONNECTS",
                            )}
                          />
                        </label>
                      </div>
                    </section>
                  )}

                  {roleSet.has(
                    "PROCESSOR",
                  ) && (
                    <section className="activity-group">
                      <div className="activity-heading">
                        <strong>
                          Processor
                        </strong>

                        <span>
                          Processing
                          Workload
                        </span>
                      </div>

                      <div className="field-grid single">
                        <label className="form-field">
                          <span>
                            Bottles Processed
                          </span>

                          <input
                            type="number"
                            name="processed"
                            min="0"
                            step="1"
                            defaultValue={metricValue(
                              "PROCESSOR",
                              "PROCESSED",
                            )}
                          />
                        </label>
                      </div>
                    </section>
                  )}

                  <section className="activity-group quality-group">
                    <div className="activity-heading">
                      <strong>
                        Quality
                      </strong>

                      <span>
                        Applies to all
                        performers
                      </span>
                    </div>

                    <div className="field-grid">
                      <label className="form-field">
                        <span>
                          EMFs
                        </span>

                        <input
                          type="number"
                          name="emfCount"
                          min="0"
                          step="1"
                          defaultValue={
                            emfEntry
                              ?.emfCount ??
                            0
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>
                          EMF Note
                        </span>

                        <input
                          type="text"
                          name="emfNote"
                          defaultValue={
                            emfEntry
                              ?.note ??
                            ""
                          }
                          placeholder="Optional"
                        />
                      </label>
                    </div>
                  </section>

                  <button
                    type="submit"
                    className="save-button"
                  >
                    Save Daily Activity
                  </button>
                </form>
              </article>
            );
          },
        )}
      </section>

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .performance-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;

            margin-bottom: 12px;
            padding: 22px;

            border: 1px solid #dfc46d;
            border-radius: 20px;

            background:
              linear-gradient(
                135deg,
                #3b2a07,
                #694908
              );

            box-shadow:
              0 10px 25px
              rgba(
                71,
                49,
                4,
                .14
              );
          }

          .section-eyebrow {
            margin: 0 0 5px;

            color: #e9c75d;

            font-size: .68rem;
            font-weight: 900;
            letter-spacing: .15em;
            text-transform: uppercase;
          }

          .performance-toolbar h2 {
            margin: 0;

            color: #ffe794;

            font-size: 1.65rem;
          }

          .toolbar-description {
            max-width: 620px;

            margin: 7px 0 0;

            color: #f5e7b8;

            font-size: .86rem;
            line-height: 1.5;
          }

          .date-form {
            display: flex;
            flex: 0 0 auto;
            align-items: flex-end;
            gap: 9px;

            padding: 12px;

            border: 1px solid
              rgba(
                255,
               255,
               255,
                .17
              );

            border-radius: 13px;

            background:
              rgba(
                255,
               255,
               255,
                .08
              );
          }

          .date-form label {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .date-form label span {
            color: #eed987;

            font-size: .62rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .date-form input {
            height: 38px;

            padding: 0 10px;

            border: 1px solid #d2b452;
            border-radius: 8px;

            background: #fffdf4;

            color: #443007;

            font-family: inherit;
            font-weight: 800;
          }

          .date-form button {
            height: 38px;

            padding: 0 14px;

            border: none;
            border-radius: 8px;

            background: #dda816;

            color: white;

            font-weight: 900;
            cursor: pointer;
          }

          .toolbar-links {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin-bottom: 14px;

            padding: 0 4px;
          }

          .toolbar-links a {
            color: #805900;

            font-size: .8rem;
            font-weight: 900;
            text-decoration: none;
          }

          .toolbar-links span {
            color: #7c725a;

            font-size: .76rem;
            font-weight: 800;
          }

          .performance-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 16px;
          }

          .worker-performance-card {
            overflow: hidden;

            border: 1px solid #dfc97d;
            border-top: 4px solid #d5a217;
            border-radius: 18px;

            background:
              linear-gradient(
                180deg,
                #ffffff,
                #fffaf0
              );

            box-shadow:
              0 8px 20px
              rgba(
                74,
                53,
                7,
                .08
              );
          }

          .worker-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;

            padding: 17px 18px;

            border-bottom: 1px solid #eadcae;

            background:
              linear-gradient(
                135deg,
                #fff9de,
                #fff1b6
              );
          }

          .worker-card-header p {
            margin: 0 0 3px;

            color: #957019;

            font-size: .63rem;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .worker-card-header h3 {
            margin: 0;

            color: #3d2b06;

            font-size: 1.2rem;
          }

          .worker-card-header small {
            display: block;

            margin-top: 4px;

            color: #81775f;
          }

          .role-pills {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 5px;

            max-width: 55%;
          }

          .role-pills span {
            padding: 5px 8px;

            border-radius: 999px;

            background: #fff;

            color: #795600;

            font-size: .57rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .entry-form {
            display: grid;
            gap: 12px;

            padding: 17px;
          }

          .activity-group {
            padding: 13px;

            border: 1px solid #e8d8a4;
            border-radius: 12px;

            background: #fffdf6;
          }

          .quality-group {
            border-color: #ddc159;

            background:
              linear-gradient(
                145deg,
                #fff9d9,
                #fff3b1
              );
          }

          .activity-heading {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;

            margin-bottom: 10px;
          }

          .activity-heading strong {
            color: #503805;

            font-size: .85rem;
          }

          .activity-heading span {
            color: #8b7b50;

            font-size: .62rem;
            font-weight: 800;
            text-transform: uppercase;
          }

          .field-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap: 10px;
          }

          .field-grid.single {
            grid-template-columns:
              minmax(
                0,
                1fr
              );
          }

          .form-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .form-field > span {
            color: #645125;

            font-size: .62rem;
            font-weight: 900;
            text-transform: uppercase;
          }

          .form-field input {
            width: 100%;
            height: 39px;

            padding: 0 10px;

            border: 1px solid #d8c47d;
            border-radius: 8px;

            background: white;

            color: #352706;

            font-family: inherit;
            font-weight: 800;
          }

          .form-field input:focus {
            border-color: #c88e00;

            outline: none;

            box-shadow:
              0 0 0 3px
              rgba(
                214,
                161,
                14,
                .15
              );
          }

          .save-button {
            justify-self: end;

            padding: 10px 17px;

            border: none;
            border-radius: 9px;

            background:
              linear-gradient(
                135deg,
                #d6a318,
                #b77c00
              );

            color: white;

            font-weight: 900;
            cursor: pointer;
          }

          @media (
            max-width: 1100px
          ) {
            .performance-grid {
              grid-template-columns:
                1fr;
            }
          }

          @media (
            max-width: 700px
          ) {
            .performance-toolbar {
              align-items: stretch;
              flex-direction: column;
            }

            .date-form {
              align-items: stretch;
              flex-direction: column;
            }

            .worker-card-header {
              flex-direction: column;
            }

            .role-pills {
              justify-content: flex-start;
              max-width: 100%;
            }

            .field-grid {
              grid-template-columns:
                1fr;
            }

            .save-button {
              width: 100%;
            }
          }
        `}
      </style>
    </AdminShell>
  );
}