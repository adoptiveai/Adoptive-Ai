'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions,
    Filler,
    ArcElement
} from 'chart.js';
import { Bar, Line, Scatter, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Box, Paper, Typography, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useMemo, useState } from 'react';
import type { GraphViewerProps } from './GraphViewer';

// Helper to decode base64 numpy arrays
function decodeBase64Array(bdata: string, dtype: string): number[] {
    const binaryString = atob(bdata);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    let array: TypedArray;
    switch (dtype) {
        case 'f8': // float64
        case '<f8':
        case '>f8':
            array = new Float64Array(bytes.buffer);
            break;
        case 'f4': // float32
        case '<f4':
        case '>f4':
            array = new Float32Array(bytes.buffer);
            break;
        case 'i4': // int32
        case '<i4':
        case '>i4':
            array = new Int32Array(bytes.buffer);
            break;
        case 'i8': // int64
        case '<i8':
        case '>i8':
            // JS doesn't fully support Int64, but for plotting usually values fit in Number
            // We can use BigInt64Array and convert to Number
            const bigIntArray = new BigInt64Array(bytes.buffer);
            return Array.from(bigIntArray).map(Number);
        case 'u4': // uint32
        case '<u4':
        case '>u4':
            array = new Uint32Array(bytes.buffer);
            break;
        case 'u8': // uint64
        case '<u8':
        case '>u8':
            const bigUintArray = new BigUint64Array(bytes.buffer);
            return Array.from(bigUintArray).map(Number);
        case 'i1': // int8
        case '|i1':
            array = new Int8Array(bytes.buffer);
            break;
        case 'u1': // uint8
        case '|u1':
            array = new Uint8Array(bytes.buffer);
            break;
        case 'i2': // int16
        case '<i2':
        case '>i2':
            array = new Int16Array(bytes.buffer);
            break;
        case 'u2': // uint16
        case '<u2':
        case '>u2':
            array = new Uint16Array(bytes.buffer);
            break;
        default:
            console.warn(`Unknown dtype: ${dtype}, returning empty array`);
            return [];
    }

    return Array.from(array);
}

// Helper to add opacity to color
function addOpacity(color: string, opacity: number): string {
    if (!color) return color;
    if (color.startsWith('#')) {
        // Add alpha to hex
        const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
        return `${color}${alpha}`;
    } else if (color.startsWith('hsla')) {
        // Already hsla, replace alpha
        return color.replace(/,[^,]+\)/, `, ${opacity})`);
    } else if (color.startsWith('hsl')) {
        return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
    } else if (color.startsWith('rgba')) {
        return color.replace(/,[^,]+\)/, `, ${opacity})`);
    } else if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    return color;
}

type TypedArray = Float64Array | Float32Array | Int32Array | Uint32Array | Int8Array | Uint8Array | Int16Array | Uint16Array;

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
    ChartDataLabels
);

export function InteractiveChart({ figure, title }: GraphViewerProps) {
    const [chartType, setChartType] = useState<string>('bar');

    const { data: plotlyData, layout } = figure;

    const chartData = useMemo<ChartData<'bar' | 'line' | 'scatter' | 'pie'>>(() => {
        if (!plotlyData || !Array.isArray(plotlyData) || plotlyData.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Helper to get array data (handles both raw arrays and serialized objects)
        const getArrayData = (data: any): any[] => {
            if (Array.isArray(data)) return data;
            if (ArrayBuffer.isView(data)) {
                return Array.from(data as any);
            }
            if (data && typeof data === 'object' && data.bdata && data.dtype) {
                return decodeBase64Array(data.bdata, data.dtype);
            }
            return [];
        };

        // Extract labels from the first trace that has x values or labels (for pie)
        // In Plotly, x can be shared or per-trace. Here we assume a shared x-axis for simplicity 
        // or take the union/first available.
        const firstTraceWithData = plotlyData.find((d: any) => d.x || d.labels) as any;
        let labels: any[] = [];
        if (firstTraceWithData) {
            if (firstTraceWithData.x) {
                labels = getArrayData(firstTraceWithData.x);
            } else if (firstTraceWithData.labels) {
                labels = getArrayData(firstTraceWithData.labels);
            }
        }

        const datasets = plotlyData.map((trace: any, index: number) => {
            const color = trace.marker?.color || trace.line?.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`;

            let yData: number[] = [];
            if (trace.y) {
                const rawY = getArrayData(trace.y);
                yData = rawY.map((v: any) => Number(v));
            } else if (trace.values) {
                const rawValues = getArrayData(trace.values);
                yData = rawValues.map((v: any) => Number(v));
            }

            // Handle color for area chart (add opacity)
            let bgColor: string | string[] = 'rgba(0,0,0,0)';
            if (chartType === 'bar') {
                bgColor = color;
            } else if (chartType === 'area') {
                bgColor = addOpacity(color, 0.2); // 20% opacity for area fill
            } else if (chartType === 'pie') {
                // Generate colors for each slice
                bgColor = yData.map((_, i) => `hsl(${(index * 137.5 + i * 45) % 360}, 70%, 50%)`);
            }

            return {
                label: trace.name || `Series ${index + 1}`,
                data: yData,
                backgroundColor: bgColor,
                borderColor: color,
                borderWidth: 2,
                // For scatter/line
                pointBackgroundColor: color,
                pointBorderColor: color,
                fill: chartType === 'area', // Simple area support
                showLine: chartType !== 'scatter', // Hide line for scatter
            };
        });

        return {
            labels,
            datasets,
        };
    }, [plotlyData, chartType]);

    const options = useMemo<ChartOptions<'bar' | 'line' | 'scatter' | 'pie'>>(() => {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: !!title || !!layout?.title,
                    text: title || (typeof layout?.title === 'string' ? layout.title : layout?.title?.text) || '',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                datalabels: {
                    display: chartType === 'pie',
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value: any, context: any) => {
                        const datapoints = context.dataset.data;
                        const total = datapoints.reduce((total: number, datapoint: number) => total + datapoint, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                        return percentage;
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: !!layout?.yaxis?.title,
                        text: (typeof layout?.yaxis?.title === 'string' ? layout.yaxis.title : layout?.yaxis?.title?.text) || '',
                    },
                    display: chartType !== 'pie', // Hide Y axis for pie chart
                },
                x: {
                    title: {
                        display: !!layout?.xaxis?.title,
                        text: (typeof layout?.xaxis?.title === 'string' ? layout.xaxis.title : layout?.xaxis?.title?.text) || '',
                    },
                    display: chartType !== 'pie', // Hide X axis for pie chart
                }
            },
        };
    }, [title, layout, chartType]);

    const renderChart = () => {
        switch (chartType) {
            case 'line':
            case 'area': // Area is just line with fill
            case 'scatter': // Scatter is line without line
                return <Line data={chartData as ChartData<'line'>} options={options as ChartOptions<'line'>} />;
            case 'pie':
                return <Pie data={chartData as ChartData<'pie'>} options={options as ChartOptions<'pie'>} />;
            case 'bar':
            default:
                return <Bar data={chartData as ChartData<'bar'>} options={options as ChartOptions<'bar'>} />;
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, width: '100%', maxWidth: '100%', overflow: 'hidden', mt: 2, border: '1px solid #e0e0e0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    Interactive Graph (Chart.js)
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="interactive-chart-type-label">Chart Type</InputLabel>
                    <Select
                        labelId="interactive-chart-type-label"
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
            <Box sx={{ width: '100%', height: 360 }}>
                {renderChart()}
            </Box>
        </Paper>
    );
}
