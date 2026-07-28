type CollectorCardProps = {
  name: string;
  role: string;
};

export default function CollectorCard({
  name,
  role,
}: CollectorCardProps) {
  return (
    <article
      style={{
        background: "white",
        borderRadius: "14px",
        padding: "18px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        border: "1px solid #f0d98a",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "8px",
        }}
      >
        🐝
      </div>

      <h3
        style={{
          margin: "0 0 6px",
          fontSize: "1.2rem",
        }}
      >
        {name}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#666",
        }}
      >
        {role}
      </p>
    </article>
  );
}