"use client"

interface DetailRow {
  type: string;
  zipcode: string;
  incidents: number;
}

export default function DetailTable({ data }: { data: DetailRow[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
        No data for this selection
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[320px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border text-muted-foreground text-left text-xs">
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">Zipcode</th>
            <th className="py-2 text-right font-medium">Incidents</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={`${row.type}-${row.zipcode}-${i}`}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="py-1.5 pr-3 truncate max-w-[200px]">
                {row.type}
              </td>
              <td className="py-1.5 pr-3 font-mono text-muted-foreground text-xs">
                {row.zipcode || "\u2014"}
              </td>
              <td className="py-1.5 text-right font-mono tabular-nums">
                {row.incidents.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
