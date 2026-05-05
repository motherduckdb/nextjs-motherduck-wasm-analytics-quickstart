"use client"

interface KPICardsProps {
  kpis: { total: number; types: number; zipcodes: number };
  rangeLabel: string;
  loading: boolean;
}

export default function KPICards({ kpis, rangeLabel, loading }: KPICardsProps) {
  const cards = [
    { label: "Total Complaints", value: kpis.total.toLocaleString() },
    { label: "Selected Range", value: rangeLabel },
    { label: "Complaint Types", value: kpis.types.toLocaleString() },
    { label: "Zipcodes", value: kpis.zipcodes.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="text-2xl font-bold font-mono mt-1 tabular-nums">
            {loading ? (
              <span className="inline-block w-16 h-7 bg-muted rounded animate-pulse" />
            ) : (
              card.value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
