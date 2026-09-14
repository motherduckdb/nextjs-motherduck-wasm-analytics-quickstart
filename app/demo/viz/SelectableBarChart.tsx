"use client"

import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface BarData {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  title: string;
  subtitle: string;
  fetchData: () => Promise<BarData[]>;
  onBarClick: (label: string | null) => void;
  selectedBar: string | null;
}

const SelectableBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  fetchData,
  onBarClick,
  selectedBar
}) => {
  const [barData, setBarData] = useState<BarData[]>([]);

  useEffect(() => {
    const initialFetch = async () => {
      const data = await fetchData();
      setBarData(data);
    }
    initialFetch();
  }, [fetchData]);



  const handlePlotClick = (event: Readonly<Plotly.PlotMouseEvent>) => {
    const clickedLabel = event.points && event.points[0] && event.points[0].y ? event.points[0].y.valueOf() as string : null;
    onBarClick(clickedLabel || null);
  };

  return (
    <Plot
      data={[
        {
          type: 'bar',
          x: barData.map(d => d.value),
          y: barData.map(d => d.label),
          orientation: 'h',
          marker: {
            color: barData.map(d => (d.label === selectedBar ? '#3b82f6' : '#6b7280')),
            opacity: 0.8
          },
          hovertemplate: '%{y}: %{x}<extra></extra>'
        }
      ]}
      layout={{
        title: {
          text: title,
          font: {
            size: 20
          },
          subtitle: { text: subtitle, font: { size: 10 } }
        },
        xaxis: {
          title: 'Value',
          fixedrange: true // Prevent x-axis zooming
        },
        yaxis: {
          title: 'Category',
          type: 'category',
          autorange: 'reversed',
          fixedrange: true
        },
        margin: { t: 70, r: 20, b: 40, l: 180 },
        bargap: 0.1,
        clickmode: 'event'
      }}
      config={{
        displayModeBar: false,
        responsive: true,
      }}
      onClick={handlePlotClick}
      style={{ width: '100%', height: '350px' }}
    />
  );
};

export default SelectableBarChart;
