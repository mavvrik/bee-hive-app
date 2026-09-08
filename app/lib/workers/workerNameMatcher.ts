export type MatchableWorker = {
  id: number;
  name: string;
  preferredName?: string | null;
};

export type WorkerNameMatchType =
  | "EXACT"
  | "DISPLAY"
  | "KNOWN_ALIAS"
  | "NORMALIZED_FULL"
  | "INITIAL_LAST"
  | "LAST_INITIAL"
  | "FIRST_NAME"
  | "AMBIGUOUS"
  | "MULTI_PERSON"
  | "NONE";

export type WorkerNameMatch<
  T extends MatchableWorker,
> = {
  worker: T | null;
  matchType: WorkerNameMatchType;
  candidates: T[];
};

/*
 * ==========================================
 * USER-CONFIRMED CSL / EMF NAME ALIASES
 * ==========================================
 *
 * Source name -> HIVE worker name.
 *
 * These supplement the generic matching
 * rules below.
 */

const CONFIRMED_NAME_ALIASES: Record<
  string,
  string
> = {
  "a marquez":
    "Ashley Marquez",

  "a steer":
    "Amando Steer",

  "anderson d":
    "Demetrius Anderson",

  "c gay":
    "Craig Gay",

  "cmckever":
    "Cheryl Mckever",

  "callahan k":
    "Kelly Callahan",

  "coleman d":
    "Daria Coleman",

  "d destefano":
    "Deirdre Destefano",

  "e cruz":
    "Emilio Leon Cruz",

  "elien f":
    "Frankie Elien",

  "g penaloza":
    "Gladys Penaloza",

  "s shannon":
    "Shantoria Shannon",

  "garner r":
    "Rhonda Garner",

  "hayes e":
    "Elisabeta Hayes",

  "j saint louis":
    "Judeland Saint-Louis",

  "jones c":
    "Cicely Bristol-Jones",

  "jones m":
    "Michelle Jones",

  "jones bristol c":
    "Cicely Bristol-Jones",

  "lyman s":
    "Shacara Lyman",

  "mills s":
    "Sanaa Mills",

  "n robertson":
    "Nellie Robertson",

  "r thompson steward":
    "Roni Thompson-Steward",

  "romero s":
    "Sergio Romero",

  "wilson s":
    "Shanya Wilson",

  /*
   * Existing HIVE nickname cases.
   */

    "keyala oneal":
    "Key",

  "keyala o neal":
    "Key",

  "ke yala oneal":
    "Key",

  "ke yala o neal":
    "Key",

  "michael stewart":
    "Mike",
};

/*
 * ==========================================
 * NORMALIZATION
 * ==========================================
 */

function normalizeWhitespace(
  value: string,
) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

function normalizeLooseName(
  value: string,
) {
  return stripDiacritics(
    value,
  )
    .toLowerCase()
    .replace(
      /['’]/g,
      "",
    )
    .replace(
      /[-_.]+/g,
      " ",
    )
    .replace(
      /,/g,
      " ",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

/*
 * Converts simple CSL names such as:
 *
 * Anderson, D
 * Gay, Craig
 *
 * into:
 *
 * D Anderson
 * Craig Gay
 *
 * Multiple-comma strings are intentionally
 * left untouched because they may contain
 * more than one employee.
 */

function reorderSimpleCommaName(
  value: string,
) {
  const cleaned =
    normalizeWhitespace(
      value,
    );

  const commaCount =
    (
      cleaned.match(
        /,/g,
      ) ?? []
    ).length;

  if (
    commaCount !== 1
  ) {
    return cleaned;
  }

  const parts =
    cleaned
      .split(",")
      .map(
        (part) =>
          normalizeWhitespace(
            part,
          ),
      )
      .filter(Boolean);

  if (
    parts.length !== 2
  ) {
    return cleaned;
  }

  return `${parts[1]} ${parts[0]}`;
}

export function normalizeWorkerName(
  value: string,
) {
  return normalizeLooseName(
    reorderSimpleCommaName(
      value,
    ),
  );
}

/*
 * ==========================================
 * UNIQUE WORKER RESOLUTION
 * ==========================================
 */

function uniqueWorkers<
  T extends MatchableWorker,
>(
  workers: T[],
) {
  return Array.from(
    new Map(
      workers.map(
        (worker) => [
          worker.id,
          worker,
        ],
      ),
    ).values(),
  );
}

function resolveUnique<
  T extends MatchableWorker,
>(
  matches: T[],
  matchType:
    WorkerNameMatchType,
): WorkerNameMatch<T> | null {
  const unique =
    uniqueWorkers(
      matches,
    );

  if (
    unique.length === 1
  ) {
    return {
      worker:
        unique[0],

      matchType,

      candidates:
        unique,
    };
  }

  if (
    unique.length > 1
  ) {
    return {
      worker: null,

      matchType:
        "AMBIGUOUS",

      candidates:
        unique,
    };
  }

  return null;
}

/*
 * ==========================================
 * MULTIPLE-PERSON / GROUP DETECTION
 * ==========================================
 *
 * IMPORTANT:
 *
 * This must be conservative.
 *
 * Ordinary worker names such as:
 *
 * Elisabeta Hayes
 * Emilio Leon Cruz
 * Kelly Callahan
 * Nellie Robertson
 *
 * must NEVER be classified as multiple
 * employees.
 */

function appearsToContainMultiplePeople(
  value: string,
) {
  const cleaned =
    normalizeWhitespace(
      value,
    );

  const lower =
    cleaned.toLowerCase();

  /*
   * Explicit separators used by EMF reports.
   *
   * Examples:
   *
   * Wright, V / Coleman, D
   * Wilson, S & Leon-Cruz, E
   */

  if (
    cleaned.includes("/") ||
    cleaned.includes("&")
  ) {
    return true;
  }

  /*
   * Two or more commas usually indicate
   * multiple Lastname, Initial pairs.
   *
   * Example:
   *
   * Gay, C  Marquez, A
   *
   * A normal single-worker entry:
   *
   * Anderson, D
   *
   * contains only one comma and remains valid.
   */

  const commaCount =
    (
      cleaned.match(
        /,/g,
      ) ?? []
    ).length;

  if (
    commaCount >= 2
  ) {
    return true;
  }

  /*
   * Detect two explicit:
   *
   * Initial. Surname, Initial. Surname
   *
   * Example:
   *
   * C. Gay, A. Wright
   *
   * This expression intentionally requires
   * BOTH names to begin with a single-letter
   * initial.
   */

  const twoInitialSurnameNames =
    /^\s*[A-Za-z]\s*\.?\s+[A-Za-z][A-Za-z'’-]*(?:[\s-]+[A-Za-z][A-Za-z'’-]*)*\s*,\s*[A-Za-z]\s*\.?\s+[A-Za-z][A-Za-z'’-]*(?:[\s-]+[A-Za-z][A-Za-z'’-]*)*\s*$/.test(
      cleaned,
    );

  if (
    twoInitialSurnameNames
  ) {
    return true;
  }

  /*
   * Collective labels cannot safely be
   * assigned to one Worker Bee.
   */

  const collectiveLabels =
    new Set([
      "management",
      "leadership",
      "center management",
      "reception staff",
      "center janitorial employee",
      "janitorial employee",
      "janitorial",
      "staff",
      "team",
    ]);

  return collectiveLabels.has(
    lower,
  );
}

/*
 * ==========================================
 * NAME PARTS
 * ==========================================
 */

function getNameParts(
  value: string,
) {
  const normalized =
    normalizeWorkerName(
      value,
    );

  const parts =
    normalized
      .split(" ")
      .filter(Boolean);

  return {
    normalized,

    first:
      parts[0] ?? "",

    last:
      parts.length >= 2
        ? parts[
            parts.length - 1
          ]
        : "",
  };
}

function workerFirstNames(
  worker: MatchableWorker,
) {
  return [
    worker.name,
    worker.preferredName,
  ]
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    )
    .map(
      (value) =>
        getNameParts(
          value,
        ).first,
    )
    .filter(Boolean);
}

function workerLastNames(
  worker: MatchableWorker,
) {
  return [
    worker.name,
    worker.preferredName,
  ]
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    )
    .map(
      (value) =>
        getNameParts(
          value,
        ).last,
    )
    .filter(Boolean);
}

/*
 * ==========================================
 * INITIAL + SURNAME PARSING
 * ==========================================
 */

function parseInitialLast(
  value: string,
) {
  const cleaned =
    stripDiacritics(
      value,
    )
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  /*
   * Examples:
   *
   * A.Steer
   * A. Steer
   * A Steer
   */

  const match =
    /^([A-Za-z])\s*\.?\s*([A-Za-z][A-Za-z'’-]*)$/i.exec(
      cleaned,
    );

  if (
    !match
  ) {
    return null;
  }

  return {
    initial:
      match[1]
        .toLowerCase(),

    last:
      normalizeLooseName(
        match[2],
      ),
  };
}

function parseLastInitial(
  value: string,
) {
  const cleaned =
    stripDiacritics(
      value,
    )
      .trim()
      .replace(
        /\s+/g,
        " ",
      );

  /*
   * Examples:
   *
   * Anderson, D
   * Rivas, D
   * Callahan, K
   */

  const match =
    /^([A-Za-z][A-Za-z'’ -]*)\s*,\s*([A-Za-z])\.?$/i.exec(
      cleaned,
    );

  if (
    !match
  ) {
    return null;
  }

  return {
    last:
      normalizeLooseName(
        match[1],
      ),

    initial:
      match[2]
        .toLowerCase(),
  };
}

/*
 * ==========================================
 * MAIN WORKER MATCHER
 * ==========================================
 */

export function matchWorkerName<
  T extends MatchableWorker,
>(
  sourceEmployeeName: string,
  workers: T[],
  options?: {
    allowUniqueFirstName?: boolean;
  },
): WorkerNameMatch<T> {
  const allowUniqueFirstName =
    options
      ?.allowUniqueFirstName ??
    true;

  const cleanedSource =
    normalizeWhitespace(
      sourceEmployeeName,
    );

  if (
    !cleanedSource
  ) {
    return {
      worker: null,
      matchType:
        "NONE",
      candidates: [],
    };
  }

  /*
   * ==========================================
   * 0. MULTIPLE PEOPLE / GROUP
   * ==========================================
   */

  if (
    appearsToContainMultiplePeople(
      cleanedSource,
    )
  ) {
    return {
      worker: null,
      matchType:
        "MULTI_PERSON",
      candidates: [],
    };
  }

  /*
   * ==========================================
   * 1. EXACT OFFICIAL NAME
   * ==========================================
   */

  const exactOfficial =
    workers.filter(
      (worker) =>
        normalizeWhitespace(
          worker.name,
        ).toLowerCase() ===
        cleanedSource.toLowerCase(),
    );

  const exactResult =
    resolveUnique(
      exactOfficial,
      "EXACT",
    );

  if (
    exactResult
  ) {
    return exactResult;
  }

  /*
   * ==========================================
   * 2. EXACT PREFERRED / DISPLAY NAME
   * ==========================================
   */

  const exactDisplay =
    workers.filter(
      (worker) =>
        worker.preferredName &&
        normalizeWhitespace(
          worker.preferredName,
        ).toLowerCase() ===
          cleanedSource.toLowerCase(),
    );

  const displayResult =
    resolveUnique(
      exactDisplay,
      "DISPLAY",
    );

  if (
    displayResult
  ) {
    return displayResult;
  }

  /*
   * ==========================================
   * 3. USER-CONFIRMED ALIAS
   * ==========================================
   */

    const rawAliasKey =
    normalizeLooseName(
      cleanedSource,
    );

  const reorderedAliasKey =
    normalizeWorkerName(
      cleanedSource,
    );

  const aliasTarget =
    CONFIRMED_NAME_ALIASES[
      rawAliasKey
    ] ??
    CONFIRMED_NAME_ALIASES[
      reorderedAliasKey
    ];

  if (
    aliasTarget
  ) {
    const target =
      normalizeLooseName(
        aliasTarget,
      );

    const aliasMatches =
      workers.filter(
        (worker) => {
          const official =
            normalizeLooseName(
              worker.name,
            );

          const preferred =
            worker.preferredName
              ? normalizeLooseName(
                  worker.preferredName,
                )
              : "";

          /*
           * Exact alias target.
           */

          if (
            official ===
              target ||
            preferred ===
              target
          ) {
            return true;
          }

          /*
           * Support aliases targeting a
           * preferred first name such as:
           *
           * Michael Stewart -> Mike
           * Ke'Yala O'Neal -> Key
           */

          const officialFirst =
            getNameParts(
              worker.name,
            ).first;

          const preferredFirst =
            worker.preferredName
              ? getNameParts(
                  worker.preferredName,
                ).first
              : "";

          return (
            officialFirst ===
              target ||
            preferredFirst ===
              target
          );
        },
      );

    const aliasResult =
      resolveUnique(
        aliasMatches,
        "KNOWN_ALIAS",
      );

    if (
      aliasResult
    ) {
      return aliasResult;
    }
  }

  /*
   * ==========================================
   * 4. NORMALIZED FULL NAME
   * ==========================================
   *
   * Handles punctuation/case differences.
   *
   * Examples:
   *
   * Saint-Louis
   * Saint Louis
   *
   * O'Neal
   * ONeal
   */

  const sourceNormalized =
    normalizeWorkerName(
      cleanedSource,
    );

  const normalizedMatches =
    workers.filter(
      (worker) => {
        const official =
          normalizeWorkerName(
            worker.name,
          );

        const preferred =
          worker.preferredName
            ? normalizeWorkerName(
                worker.preferredName,
              )
            : "";

        return (
          official ===
            sourceNormalized ||
          preferred ===
            sourceNormalized
        );
      },
    );

  const normalizedResult =
    resolveUnique(
      normalizedMatches,
      "NORMALIZED_FULL",
    );

  if (
    normalizedResult
  ) {
    return normalizedResult;
  }

  /*
   * ==========================================
   * 5. FIRST INITIAL + SURNAME
   * ==========================================
   *
   * Examples:
   *
   * A.Steer
   * A. Steer
   * N. Robertson
   */

  const initialLast =
    parseInitialLast(
      cleanedSource,
    );

  if (
    initialLast
  ) {
    const matches =
      workers.filter(
        (worker) => {
          const firstNames =
            workerFirstNames(
              worker,
            );

          const lastNames =
            workerLastNames(
              worker,
            );

          return (
            firstNames.some(
              (first) =>
                first.startsWith(
                  initialLast.initial,
                ),
            ) &&
            lastNames.includes(
              initialLast.last,
            )
          );
        },
      );

    const result =
      resolveUnique(
        matches,
        "INITIAL_LAST",
      );

    if (
      result
    ) {
      return result;
    }
  }

  /*
   * ==========================================
   * 6. SURNAME + FIRST INITIAL
   * ==========================================
   *
   * Examples:
   *
   * Anderson, D
   * Rivas, D
   * Callahan, K
   */

  const lastInitial =
    parseLastInitial(
      cleanedSource,
    );

  if (
    lastInitial
  ) {
    const matches =
      workers.filter(
        (worker) => {
          const firstNames =
            workerFirstNames(
              worker,
            );

          const lastNames =
            workerLastNames(
              worker,
            );

          return (
            firstNames.some(
              (first) =>
                first.startsWith(
                  lastInitial.initial,
                ),
            ) &&
            lastNames.includes(
              lastInitial.last,
            )
          );
        },
      );

    const result =
      resolveUnique(
        matches,
        "LAST_INITIAL",
      );

    if (
      result
    ) {
      return result;
    }
  }

  /*
   * ==========================================
   * 7. UNIQUE FIRST-NAME FALLBACK
   * ==========================================
   *
   * Preserve the established HIVE behavior:
   *
   * if the report's first name uniquely
   * identifies one Worker Bee, use it.
   *
   * If multiple workers share that first
   * name, resolveUnique returns AMBIGUOUS
   * rather than guessing.
   */

  if (
    allowUniqueFirstName
  ) {
    const sourceFirst =
      getNameParts(
        cleanedSource,
      ).first;

    if (
      sourceFirst
    ) {
      const matches =
        workers.filter(
          (worker) =>
            workerFirstNames(
              worker,
            ).includes(
              sourceFirst,
            ),
        );

      const result =
        resolveUnique(
          matches,
          "FIRST_NAME",
        );

      if (
        result
      ) {
        return result;
      }
    }
  }

  /*
   * ==========================================
   * NO SAFE MATCH
   * ==========================================
   */

  return {
    worker: null,
    matchType:
      "NONE",
    candidates: [],
  };
}