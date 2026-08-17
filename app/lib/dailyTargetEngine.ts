export type DailyTargetEntry = {
  entryDate: Date;
  liters: number;
  donors: number;
};

export type DailyTargetEngineInput = {
  weeklyGoalLiters: number;
  weeklyGoalDonors: number;

  weekStart: Date;
  today: Date;

  entries: DailyTargetEntry[];
};

export type DailyTargetDay = {
  date: Date;
  key: string;

  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;

  targetLiters: number;
  targetDonors: number;

  actualLiters: number | null;
  actualDonors: number | null;

  varianceLiters: number | null;
  completionPercentage: number | null;
};

export type DailyTargetEngineResult = {
  weeklyGoalLiters: number;
  weeklyGoalDonors: number;

  weeklyActualLiters: number;
  weeklyActualDonors: number;

  weeklyRemainingLiters: number;
  weeklyRemainingDonors: number;

  weeklyCompletionPercentage: number;

  todaysTargetLiters: number;
  todaysTargetDonors: number;

  nextRequiredLiters: number;
  nextRequiredDonors: number;

  futureDaysRemaining: number;

  days: DailyTargetDay[];
};

function safeDivide(
  numerator: number,
  denominator: number,
) {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}

function clampMinimumZero(
  value: number,
) {
  return Math.max(
    0,
    value,
  );
}

function roundToOne(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        10,
    ) / 10
  );
}

function formatDateKey(
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

function createWeekDates(
  weekStart: Date,
) {
  return Array.from(
    { length: 7 },
    (_, index) => {
      const date =
        new Date(
          weekStart,
        );

      date.setDate(
        date.getDate() +
          index,
      );

      return startOfDay(
        date,
      );
    },
  );
}

export function getDailyTargets(
  input: DailyTargetEngineInput,
): DailyTargetEngineResult {
  const weekStart =
    startOfDay(
      input.weekStart,
    );

  const today =
    startOfDay(
      input.today,
    );

  const weekDates =
    createWeekDates(
      weekStart,
    );

  const todayKey =
    formatDateKey(
      today,
    );

  const todayIndexRaw =
    weekDates.findIndex(
      (date) =>
        formatDateKey(
          date,
        ) ===
        todayKey,
    );

  const todayIndex =
    todayIndexRaw >= 0
      ? todayIndexRaw
      : 0;

  const entryByDate =
    new Map(
      input.entries.map(
        (entry) => [
          formatDateKey(
            startOfDay(
              entry.entryDate,
            ),
          ),
          entry,
        ],
      ),
    );

  const weeklyActualLiters =
    input.entries.reduce(
      (
        total,
        entry,
      ) =>
        total +
        entry.liters,
      0,
    );

  const weeklyActualDonors =
    input.entries.reduce(
      (
        total,
        entry,
      ) =>
        total +
        entry.donors,
      0,
    );

  const weeklyRemainingLiters =
    clampMinimumZero(
      input.weeklyGoalLiters -
        weeklyActualLiters,
    );

  const weeklyRemainingDonors =
    clampMinimumZero(
      input.weeklyGoalDonors -
        weeklyActualDonors,
    );

  const weeklyCompletionPercentage =
    safeDivide(
      weeklyActualLiters,
      input.weeklyGoalLiters,
    ) * 100;

  const actualBeforeTodayLiters =
    weekDates
      .slice(
        0,
        todayIndex,
      )
      .reduce(
        (
          total,
          date,
        ) => {
          const entry =
            entryByDate.get(
              formatDateKey(
                date,
              ),
            );

          return (
            total +
            (
              entry?.liters ??
              0
            )
          );
        },
        0,
      );

  const actualBeforeTodayDonors =
    weekDates
      .slice(
        0,
        todayIndex,
      )
      .reduce(
        (
          total,
          date,
        ) => {
          const entry =
            entryByDate.get(
              formatDateKey(
                date,
              ),
            );

          return (
            total +
            (
              entry?.donors ??
              0
            )
          );
        },
        0,
      );

  const daysIncludingToday =
    Math.max(
      1,
      7 -
        todayIndex,
    );

  const todaysTargetLiters =
    safeDivide(
      clampMinimumZero(
        input.weeklyGoalLiters -
          actualBeforeTodayLiters,
      ),
      daysIncludingToday,
    );

  const todaysTargetDonors =
    safeDivide(
      clampMinimumZero(
        input.weeklyGoalDonors -
          actualBeforeTodayDonors,
      ),
      daysIncludingToday,
    );

  const todayEntry =
    entryByDate.get(
      todayKey,
    ) ?? null;

  const futureDaysRemaining =
    Math.max(
      0,
      6 -
        todayIndex,
    );

  const actualThroughTodayLiters =
    actualBeforeTodayLiters +
    (
      todayEntry?.liters ??
      0
    );

  const actualThroughTodayDonors =
    actualBeforeTodayDonors +
    (
      todayEntry?.donors ??
      0
    );

  const nextRequiredLiters =
    futureDaysRemaining > 0
      ? safeDivide(
          clampMinimumZero(
            input.weeklyGoalLiters -
              actualThroughTodayLiters,
          ),
          futureDaysRemaining,
        )
      : clampMinimumZero(
          input.weeklyGoalLiters -
            actualThroughTodayLiters,
        );

  const nextRequiredDonors =
    futureDaysRemaining > 0
      ? safeDivide(
          clampMinimumZero(
            input.weeklyGoalDonors -
              actualThroughTodayDonors,
          ),
          futureDaysRemaining,
        )
      : clampMinimumZero(
          input.weeklyGoalDonors -
            actualThroughTodayDonors,
        );

  let cumulativeLiters =
    0;

  let cumulativeDonors =
    0;

  const days =
    weekDates.map(
      (
        date,
        index,
      ): DailyTargetDay => {
        const key =
          formatDateKey(
            date,
          );

        const entry =
          entryByDate.get(
            key,
          ) ?? null;

        const daysRemainingAtStart =
          7 -
          index;

        const isToday =
          key ===
          todayKey;

        const isPast =
          date.getTime() <
          today.getTime();

        const isFuture =
          date.getTime() >
          today.getTime();

        let targetLiters:
          number;

        let targetDonors:
          number;

        if (
          isPast ||
          isToday
        ) {
          targetLiters =
            safeDivide(
              clampMinimumZero(
                input.weeklyGoalLiters -
                  cumulativeLiters,
              ),
              daysRemainingAtStart,
            );

          targetDonors =
            safeDivide(
              clampMinimumZero(
                input.weeklyGoalDonors -
                  cumulativeDonors,
              ),
              daysRemainingAtStart,
            );
        } else {
          targetLiters =
            nextRequiredLiters;

          targetDonors =
            nextRequiredDonors;
        }

        const actualLiters =
          entry?.liters ??
          null;

        const actualDonors =
          entry?.donors ??
          null;

        const varianceLiters =
          actualLiters !==
          null
            ? (
                actualLiters -
                targetLiters
              )
            : null;

        const completionPercentage =
          actualLiters !==
            null &&
          targetLiters > 0
            ? (
                actualLiters /
                targetLiters
              ) * 100
            : null;

        if (entry) {
          cumulativeLiters +=
            entry.liters;

          cumulativeDonors +=
            entry.donors;
        }

        return {
          date,
          key,

          isPast,
          isToday,
          isFuture,

          targetLiters:
            roundToOne(
              targetLiters,
            ),

          targetDonors:
            Math.ceil(
              targetDonors,
            ),

          actualLiters,

          actualDonors,

          varianceLiters:
            varianceLiters ===
            null
              ? null
              : roundToOne(
                  varianceLiters,
                ),

          completionPercentage:
            completionPercentage ===
            null
              ? null
              : roundToOne(
                  completionPercentage,
                ),
        };
      },
    );

  return {
    weeklyGoalLiters:
      roundToOne(
        input.weeklyGoalLiters,
      ),

    weeklyGoalDonors:
      input.weeklyGoalDonors,

    weeklyActualLiters:
      roundToOne(
        weeklyActualLiters,
      ),

    weeklyActualDonors,

    weeklyRemainingLiters:
      roundToOne(
        weeklyRemainingLiters,
      ),

    weeklyRemainingDonors,

    weeklyCompletionPercentage:
      roundToOne(
        weeklyCompletionPercentage,
      ),

    todaysTargetLiters:
      roundToOne(
        todaysTargetLiters,
      ),

    todaysTargetDonors:
      Math.ceil(
        todaysTargetDonors,
      ),

    nextRequiredLiters:
      roundToOne(
        nextRequiredLiters,
      ),

    nextRequiredDonors:
      Math.ceil(
        nextRequiredDonors,
      ),

    futureDaysRemaining,

    days,
  };
}