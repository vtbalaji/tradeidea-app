'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartDataResponse {
  symbol: string;
  data: OHLCVData[];
  lastUpdated: string;
  recordCount: number;
}

interface PriceChartProps {
  symbol: string;
  days?: number;
  height?: string;
}

export default function PriceChart({ symbol, days = 365, height = '400px' }: PriceChartProps) {
  const [data, setData] = useState<OHLCVData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);

        // Remove NS_ prefix if present for file lookup
        const cleanSymbol = symbol.replace(/^NS_/, '');

        // Fetch from static JSON file
        const response = await fetch(`/chart-data/${cleanSymbol}.json`);

        if (!response.ok) {
          throw new Error('Chart data not available');
        }

        const chartData: ChartDataResponse = await response.json();

        // Filter to requested days
        const filteredData = chartData.data.slice(-days);

        setData(filteredData);
        setLastUpdated(chartData.lastUpdated);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching chart data:', err);
        setError(err.message || 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [symbol, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="w-8 h-8 border-4 border-[#ff8c42] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8" style={{ height }}>
        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error || 'No chart data available'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Chart data will be available after running the EOD batch process</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Price',
        data: data.map(d => d.close),
        borderColor: '#ff8c42',
        backgroundColor: 'rgba(255, 140, 66, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#ff8c42',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 12,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 11
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const dataPoint = data[context.dataIndex];
            return [
              `Open: ₹${dataPoint.open.toFixed(2)}`,
              `High: ₹${dataPoint.high.toFixed(2)}`,
              `Low: ₹${dataPoint.low.toFixed(2)}`,
              `Close: ₹${dataPoint.close.toFixed(2)}`,
              `Volume: ${dataPoint.volume.toLocaleString()}`,
            ];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxTicksLimit: 10,
          color: '#8b949e',
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(139, 148, 158, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#8b949e',
          font: {
            size: 10
          },
          callback: function(value: any) {
            return '₹' + value.toFixed(0);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    }
  };

  return (
    <div className="w-full">
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
      {lastUpdated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
  );
}
