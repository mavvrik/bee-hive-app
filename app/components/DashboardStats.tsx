type DashboardStatsProps = {
  monthlyGoal: number;
  weeksInPeriod: number;
  currentLiters?: number;
};

export default function DashboardStats({
  monthlyGoal,
  weeksInPeriod,
  currentLiters = 0,
}: DashboardStatsProps) {
  const weeklyGoal =
    weeksInPeriod > 0 ? monthlyGoal / weeksInPeriod : 0;

  const percentComplete =
    monthlyGoal > 0
      ? (currentLiters / monthlyGoal) * 100
      : 0;

const remainingLiters = Math.max(monthlyGoal - currentLiters, 0);

  const stats = [
    {
      label: "Monthly Goal",
      value: `${monthlyGoal.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} L`,
    },
    {
      label: "Weekly Goal",
      value: `${weeklyGoal.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} L`,
    },
    {
      label: "Current Liters",
      value: `${currentLiters.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} L`,
    },
    {
      label: "Progress",
      value: `${percentComplete.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
    },
      {
  label: "Remaining Liters",
  value: `${remainingLiters.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} L`,
},
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "32px",
      }}
    >
      {stats.map((stat) => (
        <article
          key={stat.label}
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid #ead58f",
            boxShadow: "0 4px 12px rgba(0,0,0,.07)",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              color: "#6b6250",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {stat.label}
          </p>

          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#2f2a20",
            }}
          >
            {stat.value}
          </div>
        </article>
      ))}
    </section>
  );
}