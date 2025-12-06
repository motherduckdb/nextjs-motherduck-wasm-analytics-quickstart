"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { PlotRelayoutEvent } from 'plotly.js';

// Type definition for the data structure
type ZipcodeData = {
  zipcode: string;
  value: number;
};

type NYCZipcodeHeatMapProps = {
  fetchData: () => Promise<ZipcodeData[]>;
  title?: string;
};

const NYCZipcodeHeatMap: React.FC<NYCZipcodeHeatMapProps> = ({
  fetchData,
  title = 'NYC Heatmap'
}) => {
  const [data, setData] = useState<ZipcodeData[]>([]);
  const [geoJson, setGeoJson] = useState(null);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [mapView, setMapView] = useState({
    center: { lat: 40.7128, lon: -74.0060 },
    zoom: 10
  });

  // Fetch GeoJSON data
  const fetchGeoJson = useCallback(async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ny_new_york_zip_codes_geo.min.json');
      const data = await response.json();
      setGeoJson(data);
    } catch (error) {
      setError('Failed to load map data');
      console.error('Error fetching GeoJSON:', error);
    }
  }, []);

  // Handle data refresh
  const handleDataRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newData = await fetchData();
      setData(newData);
    } catch (error) {
      setError('Failed to load heatmap data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchGeoJson();
    handleDataRefresh();
  }, [fetchData, handleDataRefresh, fetchGeoJson]);


  const plotData = [{
    type: 'choroplethmapbox',
    geojson: geoJson,
    locations: data.map(d => d.zipcode),
    z: data.map(d => d.value),
    featureidkey: 'properties.ZCTA5CE10',
    colorscale: [
      [0, 'rgb(242,240,247)'],
      [0.2, 'rgb(218,218,235)'],
      [0.4, 'rgb(188,189,220)'],
      [0.6, 'rgb(158,154,200)'],
      [0.8, 'rgb(117,107,177)'],
      [1, 'rgb(84,39,143)']
    ],
    showscale: true,
    hovertemplate: 'Zip: %{location}<br>Count: %{z}<extra></extra>'
  }];

  const layout = {
    title: {
      text: title,
      font: {
        size: 20
      },
    },
    mapbox: {
      style: 'open-street-map',
      center: mapView.center,
      zoom: mapView.zoom
    },
    margin: { t: 100, b: 0, l: 10, r: 50 },
    modebar: { orientation: 'v' },

  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: [
      'lasso2d',
      'pan2d',
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
      'toggleSpikelines',
      'select2d',
      'toImage',
    ],
  };


  return (
    <div className="space-y-4">
      {/* @ts-expect-error: missing type defs for mapbox */}
      <Plot
        title={title}
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '600px' }}
        onRelayout={(e: PlotRelayoutEvent) => {
          const newCenter = e['mapbox.center' as keyof PlotRelayoutEvent] as { lat: number, lon: number } | undefined;
          const newZoom = e['mapbox.zoom' as keyof PlotRelayoutEvent] as number | undefined;


          // Update state when map is panned/zoomed
          if (newCenter || newZoom) {
            setMapView({
              center: newCenter || mapView.center,
              zoom: newZoom || mapView.zoom
            });
          }
        }}
      />
    </div>
  );
};

export default NYCZipcodeHeatMap;