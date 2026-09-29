"use client"

import React, { useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Brush, CartesianGrid } from 'recharts';
import useContainerWidth from '../hooks/useContainerWidth';

interface MonthCount {
  ym: number;    // YYYYMM integer, e.g. 201503
  month: number; // 1-12
  value: number;
}

interface Props {
  data: MonthCount[];
  selectedRange: [number, number]; // ym values
  onRangeChange: (range: [number, number]) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CHART_HEIGHT = 300;

export default function RangeSweepBarChart({ data, selectedRange, onRangeChange }: Props) {
  const { ref, width } = useContainerWidth();

  const handleBrushChange = useCallback(
    (range: { startIndex?: number; endIndex?: number }) => {
      if (range.startIndex !== undefined && range.endIndex !== undefined && data.length > 0) {
        onRangeChange([data[range.startIndex].ym, data[range.endIndex].ym]);
      }
    },
    [data, onRangeChange],
  );

  // Map selected ym range to brush indices
  const startIndex = useMemo(() => {
    const idx = data.findIndex((d) => d.ym >= selectedRange[0]);
    return idx >= 0 ? idx : 0;
  }, [data, selectedRange]);

  const endIndex = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].ym <= selectedRange[1]) return i;
    }
    return Math.max(0, data.length - 1);
  }, [data, selectedRange]);

  // Only show tick marks at January of each year
  const yearTicks = useMemo(
    () => data.filter((d) => d.month === 1).map((d) => d.ym),
    [data],
  );

  return (
    <div ref={ref} style={{ minHeight: CHART_HEIGHT }}>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm animate-pulse">
          Loading chart&hellip;
        </div>
      ) : width > 0 ? (
        <BarChart width={width} height={CHART_HEIGHT} data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" vertical={false} />
          <XAxis
            dataKey="ym"
            ticks={yearTicks}
            tickFormatter={(ym: number) => String(Math.floor(ym / 100))}
            stroke="hsl(0 0% 40%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(0 0% 40%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(0 0% 7%)',
              border: '1px solid hsl(0 0% 20%)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelStyle={{ color: 'hsl(0 0% 55%)' }}
            itemStyle={{ color: 'hsl(0 0% 90%)' }}
            formatter={(value) => [Number(value).toLocaleString(), 'Complaints']}
            labelFormatter={(label) => {
              const ym = Number(label);
              const month = ym % 100;
              const year = Math.floor(ym / 100);
              return `${MONTHS[month - 1]} ${year}`;
            }}
            cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }}
          />
          <Bar dataKey="value" fill="hsl(217.2 91.2% 59.8%)" radius={[2, 2, 0, 0]} />
          <Brush
            dataKey="ym"
            height={30}
            fill="hsl(0 0% 5%)"
            stroke="hsl(0 0% 25%)"
            startIndex={startIndex}
            endIndex={endIndex}
            onChange={handleBrushChange}
            travellerWidth={8}
            tickFormatter={(ym: number) => {
              const month = ym % 100;
              const year = Math.floor(ym / 100);
              return `${MONTHS[month - 1]} '${String(year).slice(2)}`;
            }}
          />
        </BarChart>
      ) : null}
    </div>
  );
}
