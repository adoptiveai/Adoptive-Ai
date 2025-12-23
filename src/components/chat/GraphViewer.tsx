'use client';

import { useEffect, useRef, useState } from 'react';
import Plotly, { Data, Layout, Config } from 'plotly.js-dist-min';
import { Box, Paper, FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';

export interface GraphViewerProps {
  figure: {
    data: Data[];
    layout?: Partial<Layout> | null;
    config?: Partial<Config> | null;
  };
  title?: string;
}

export function GraphViewer({ figure, title }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartType, setChartType] = useState<string>('bar');

  useEffect(() => {
    if (!containerRef.current) return;
    const node = containerRef.current;

    // Transform data based on selected chart type
    const plotData = Array.isArray(figure.data) ? figure.data.map((d: any) => {
      const base = { ...d };

      switch (chartType) {
        case 'bar':
          base.type = 'bar';
          base.mode = undefined;
          base.fill = undefined;
          break;
        case 'line':
          base.type = 'scatter';
          base.mode = 'lines+markers';
          base.fill = undefined;
          break;
        case 'scatter':
          base.type = 'scatter';
          base.mode = 'markers';
          base.fill = undefined;
          break;
        case 'area':
          base.type = 'scatter';
          base.mode = 'lines';
          base.fill = 'tozeroy';
          break;
        case 'pie':
          base.type = 'pie';
          if (base.x) base.labels = base.x;
          if (base.y) base.values = base.y;
          // Remove x and y to avoid conflicts with pie chart
          if (base.x) delete base.x;
          if (base.y) delete base.y;
          // Remove hovertemplate as it likely uses %{x} and %{y} which are invalid for pie
          delete base.hovertemplate;
          break;
      }
      return base;
    }) : [];

    // Default layout matching react-frontend
    // Exclude width and height to allow autosize to work
    const { width, height, ...restLayout } = figure.layout || {};

    const defaultLayout: Partial<Layout> = {
      autosize: true,
      margin: { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Arial, sans-serif', size: 12 },
      ...restLayout,
    };

    // Default config matching react-frontend
    const defaultConfig: Partial<Config> = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
      responsive: true,
      ...figure.config,
    };

    Plotly.react(node, plotData, defaultLayout as Layout, defaultConfig as Config).catch((error: any) => {
      console.error('Failed to render graph', error);
    });

    return () => {
      Plotly.purge(node);
    };
  }, [figure, chartType]);

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {title && <h4 style={{ margin: 0 }}>{title}</h4>}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="chart-type-label">Chart Type</InputLabel>
          <Select
            labelId="chart-type-label"
            value={chartType}
            label="Chart Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            <MenuItem value="bar">Bar Chart</MenuItem>
            <MenuItem value="line">Line Chart</MenuItem>
            <MenuItem value="scatter">Scatter Plot</MenuItem>
            <MenuItem value="area">Area Chart</MenuItem>
            <MenuItem value="pie">Pie Chart</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Box ref={containerRef} sx={{ width: '100%', height: 360 }} />
    </Paper>
  );
}
