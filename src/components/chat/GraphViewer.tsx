'use client';

import { useEffect, useRef, useState } from 'react';
import Plotly, { Data, Layout, Config } from 'plotly.js-dist-min';
import { Box, Paper, FormControl, InputLabel, Select, MenuItem, Stack, useTheme, useMediaQuery } from '@mui/material';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

    // Theme-aware colors
    const textColor = theme.palette.text.primary;
    const axisColor = theme.palette.text.secondary;
    const gridColor = theme.palette.divider;

    const defaultLayout: Partial<Layout> = {
      autosize: true,
      margin: isMobile
        ? { l: 30, r: 10, t: 30, b: 30 }
        : { l: 50, r: 50, t: 50, b: 50 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: {
        family: 'Inter, Roboto, sans-serif',
        size: isMobile ? 10 : 12,
        color: textColor
      },
      xaxis: {
        color: axisColor,
        gridcolor: gridColor,
        zerolinecolor: gridColor,
      },
      yaxis: {
        color: axisColor,
        gridcolor: gridColor,
        zerolinecolor: gridColor,
      },
      legend: {
        font: {
          color: textColor,
        },
        // On mobile, maybe hide logical legend or adjust? 
        // Plotly handles it relatively well, but we can forcing orientation if needed
        orientation: isMobile ? 'h' : 'v',
        y: isMobile ? -0.2 : 1,
      },
      ...restLayout,
    };

    // Default config matching react-frontend
    const defaultConfig: Partial<Config> = {
      displayModeBar: !isMobile, // Hide mode bar on mobile to save space
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
  }, [figure, chartType, theme, isMobile]);

  return (
    <Paper elevation={2} sx={{ p: isMobile ? 1 : 2, borderRadius: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {title && <h4 style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem' }}>{title}</h4>}
        <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 120 }}>
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
      <Box ref={containerRef} sx={{ width: '100%', height: isMobile ? 300 : 360 }} />
    </Paper>
  );
}
