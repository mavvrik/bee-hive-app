import CollectorCard from "@/app/components/CollectorCard";

type Collector = {
  id: number;
  name: string;
  role: string;
};

type CollectorGridProps = {
  collectors: Collector[];
};

export default function CollectorGrid({
  collectors,
}: CollectorGridProps) {
  return (
    <section>
      <h2
        style={{
          marginBottom: "16px",
        }}
      >
        Collection Team
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {collectors.map((collector) => (
          <CollectorCard
            key={collector.id}
            name={collector.name}
            role={collector.role}
          />
        ))}
      </div>
    </section>
  );
}