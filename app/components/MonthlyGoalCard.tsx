type MonthlyGoalCardProps = {
  monthlyGoal: number;
  weeksInPeriod: number;
};

export default function MonthlyGoalCard({
  monthlyGoal,
  weeksInPeriod,
}: MonthlyGoalCardProps) {
  const weeklyTarget = Math.round(monthlyGoal / weeksInPeriod);

  return (
    <section
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "500px",
        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
        marginBottom: "32px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Monthly Goal</h3>

      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          color: "#d4a017",
        }}
      >
        {monthlyGoal.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        L
      </div>

      <p>Weekly target: {weeklyTarget.toLocaleString("en-US")} L</p>
    </section>
  );
}