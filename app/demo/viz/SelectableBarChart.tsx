"use client"

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import useContainerWidth from '../hooks/useContainerWidth';

interface BarData {
  label: string;
  value: number;
}

interface Props {
  data: BarData[];
  onBarClick: (label: string | null) => void;
  selectedBar: string | null;
}

const CHART_HEIGHT = 320;

export default function SelectableBarChart({ data, onBarClick, selectedBar }: Props) {
  const { ref, width } = useContainerWidth();

  return (
    <div ref={ref} style={{ minHeight: CHART_HEIGHT }}>
      {data.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm animate-pulse">
          Loading chart&hellip;
        </div>
      ) : width > 0 ? (
        <BarChart width={width} height={CHART_HEIGHT} data={data} layout="vertical">
          <XAxis
            type="number"
            stroke="hsl(0 0% 40%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={150}
            tick={{ fontSize: 11, fill: 'hsl(0 0% 55%)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(0 0% 7%)',
              border: '1px solid hsl(0 0% 20%)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            itemStyle={{ color: 'hsl(0 0% 90%)' }}
            formatter={(value) => [Number(value).toLocaleString(), 'Complaints']}
            cursor={{ fill: 'hsl(0 0% 100% / 0.04)' }}
          />
          <Bar
            dataKey="value"
            cursor="pointer"
            radius={[0, 3, 3, 0]}
            onClick={(_data, index) => {
              const clicked = data[index];
              if (clicked) {
                onBarClick(clicked.label === selectedBar ? null : clicked.label);
              }
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={
                  entry.label === selectedBar
                    ? 'hsl(217.2 91.2% 59.8%)'
                    : 'hsl(0 0% 28%)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      ) : null}
    </div>
  );
}
