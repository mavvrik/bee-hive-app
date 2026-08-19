export type WorkerStreakEntry = {
  collectorId: number;
  entryDate: Date;
  totalSticks: number;
  successfulSticks: number;
};

export type WorkerVarianceStreak = {
  collectorId: number;

  streakDays: number;

  latestVerifiedDate:
    Date | null;

  latestEligibleDate:
    Date | null;

  lastEligibleDayWasClean:
    boolean | null;
};

function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getDateKey(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateVarianceStreaks({
  entries,
  today,
}: {
  entries: WorkerStreakEntry[];
  today: Date;
}) {
  /*
   * Only completed / verified days count.
   *
   * Today's data is intentionally excluded
   * because worker performance is normally
   * received the following morning.
   */

  const startOfToday =
    startOfDay(
      today,
    );

  const verifiedEntries =
    entries.filter(
      (entry) =>
        entry.entryDate <
        startOfToday,
    );

  /*
   * There should normally be one record per
   * collector per date, but grouping by date
   * keeps this engine safe if that ever changes.
   */

  const workerDayTotals =
    new Map<
      number,
      Map<
        string,
        {
          date: Date;
          totalSticks: number;
          successfulSticks: number;
        }
      >
    >();

  for (
    const entry of
      verifiedEntries
  ) {
    let workerDays =
      workerDayTotals.get(
        entry.collectorId,
      );

    if (!workerDays) {
      workerDays =
        new Map();

      workerDayTotals.set(
        entry.collectorId,
        workerDays,
      );
    }

    const key =
      getDateKey(
        entry.entryDate,
      );

    const current =
      workerDays.get(
        key,
      ) ?? {
        date:
          startOfDay(
            entry.entryDate,
          ),

        totalSticks: 0,

        successfulSticks: 0,
      };

    current.totalSticks +=
      entry.totalSticks;

    current.successfulSticks +=
      entry.successfulSticks;

    workerDays.set(
      key,
      current,
    );
  }

  const result =
    new Map<
      number,
      WorkerVarianceStreak
    >();

  for (
    const [
      collectorId,
      workerDays,
    ] of workerDayTotals
  ) {
    /*
     * IMPORTANT:
     *
     * 0 or 1 total stick means the worker
     * is NOT considered to have a qualifying
     * phlebotomy workday.
     *
     * Those days are ignored completely and
     * do not advance or break the streak.
     */

    const eligibleDays =
      Array.from(
        workerDays.values(),
      )
        .filter(
          (day) =>
            day.totalSticks >
            1,
        )
        .sort(
          (a, b) =>
            a.date.getTime() -
            b.date.getTime(),
        );

    let streakDays =
      0;

    let latestEligibleDate:
      Date | null =
      null;

    let lastEligibleDayWasClean:
      boolean | null =
      null;

    for (
      const day of
        eligibleDays
    ) {
      const unsuccessfulSticks =
        Math.max(
          0,
          day.totalSticks -
            day.successfulSticks,
        );

      const cleanDay =
        unsuccessfulSticks ===
        0;

      latestEligibleDate =
        day.date;

      lastEligibleDayWasClean =
        cleanDay;

      if (cleanDay) {
        streakDays +=
          1;
      } else {
        /*
         * Any unsuccessful stick on an
         * eligible workday resets the streak.
         */
        streakDays =
          0;
      }
    }

    const latestVerifiedDate =
      eligibleDays.length >
      0
        ? eligibleDays[
            eligibleDays.length -
              1
          ].date
        : null;

    result.set(
      collectorId,
      {
        collectorId,

        streakDays,

        latestVerifiedDate,

        latestEligibleDate,

        lastEligibleDayWasClean,
      },
    );
  }

  return result;
}