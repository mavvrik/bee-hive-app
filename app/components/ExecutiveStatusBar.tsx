type HivePerformance = {
  goalAchieved: boolean;
  percentage: number;
  message: string;
};

type ExecutiveStatusBarProps = {
  dayName: string;
  stageLabel: string;
  weekRange: string;
  hivePerformance: HivePerformance;
  weeklyCurrentLiters: number;
  weeklyTarget: number;
  weeklyCurrentSticks: number;
  weeklyLitersPerStick: number;
};

export default function ExecutiveStatusBar({
  dayName,
  stageLabel,
  weekRange,
  hivePerformance,
  weeklyCurrentLiters,
  weeklyTarget,
  weeklyCurrentSticks,
  weeklyLitersPerStick,
}: ExecutiveStatusBarProps) {
  return (
    <section
      aria-label="Current operational week"
      style={{
        display: "grid",
        gridTemplateColumns:
          "1fr auto auto auto auto",
        alignItems: "center",
        gap: "24px",
        marginTop: "12px",
        padding: "10px 18px",
        border: hivePerformance.goalAchieved
          ? "1px solid #d99b0b"
          : "1px solid #dfc36c",
        borderRadius: "14px",
        background:
          hivePerformance.goalAchieved
            ? "linear-gradient(90deg, #fff5bd, #ffe28a)"
            : "linear-gradient(90deg, #fffdf4, #fff4c7)",
        boxShadow:
          hivePerformance.goalAchieved
            ? "0 5px 18px rgba(203, 139, 6, 0.18)"
            : "0 4px 12px rgba(98, 70, 10, 0.08)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 3px",
            color: "#98701d",
            fontSize: "0.65rem",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Sunday–Saturday Operational Week
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <strong
            style={{
              color: "#3c2a08",
              fontSize: "1.05rem",
            }}
          >
            {dayName}: {stageLabel}
          </strong>

          <span
            style={{
              color: "#7a6538",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {weekRange}
          </span>
        </div>

        <p
          style={{
            margin: "3px 0 0",
            color: "#69562e",
            fontSize: "0.7rem",
            fontWeight: 600,
          }}
        >
          {hivePerformance.message}
        </p>
      </div>

      <MetricBlock
        label="Weekly Liters"
        value={formatLiters(
          weeklyCurrentLiters,
        )}
        detail={`of ${formatLiters(
          weeklyTarget,
        )}`}
        minWidth="150px"
      />

      <MetricBlock
        label="Weekly Sticks"
        value={weeklyCurrentSticks.toLocaleString(
          "en-US",
        )}
        detail="donor procedures"
        minWidth="105px"
      />

      <MetricBlock
        label="Liters / Stick"
        value={weeklyLitersPerStick.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          },
        )}
        detail="weekly yield"
        minWidth="105px"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "72px",
          height: "72px",
          border:
            "2px solid rgba(191, 137, 16, 0.58)",
          borderRadius: "50%",
          background:
            hivePerformance.goalAchieved
              ? "linear-gradient(180deg, #ffd94f, #e8a713)"
              : "linear-gradient(180deg, #fff4b0, #e9c353)",
          boxShadow:
            hivePerformance.goalAchieved
              ? "0 0 18px rgba(230, 164, 23, 0.45)"
              : "none",
          color: "#3d2a05",
          fontSize: "1.13rem",
          fontWeight: 900,
        }}
      >
        {Math.round(
          hivePerformance.percentage,
        )}
        %
      </div>
    </section>
  );
}

type MetricBlockProps = {
  label: string;
  value: string;
  detail: string;
  minWidth: string;
};

function MetricBlock({
  label,
  value,
  detail,
  minWidth,
}: MetricBlockProps) {
  return (
    <div
      style={{
        minWidth,
        textAlign: "right",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#8b6a22",
          fontSize: "0.58rem",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "2px",
          color: "#342406",
          fontSize: "1.15rem",
        }}
      >
        {value}
      </strong>

      <small
        style={{
          color: "#766239",
          fontSize: "0.65rem",
          fontWeight: 700,
        }}
      >
        {detail}
      </small>
    </div>
  );
}

function formatLiters(value: number) {
  return `${value.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )} L`;
}