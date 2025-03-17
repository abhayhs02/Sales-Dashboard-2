import React, { useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import './GeoMapPieChart.css'; // Import CSS

ChartJS.register(ArcElement, Tooltip, Legend, Title, ChartDataLabels);

const GeoMapPieChart = ({ data, onClose, countryName }) => {
  const chartRef = useRef(null);

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Count',
        data: data.map(item => item.value),
        backgroundColor: [
          'rgba(250, 8, 61, 0.9)',    // Red
          'rgba(12, 151, 244, 0.9)',   // Blue
          'rgba(244, 178, 13, 0.9)',   // Yellow
          'rgba(34, 208, 208, 0.9)',   // Green
          'rgba(87, 33, 194, 0.9)',  // Purple
          'rgba(225, 121, 18, 0.9)',   // Orange
          'rgba(66, 210, 30, 0.9)',  // Light Green
          'rgba(198, 52, 16, 0.9)',  // Light Red
          'rgba(18, 53, 194, 0.9)',  // Light Blue
          'rgba(184, 12, 47, 0.9)',  // Light Pink
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            weight: 'bold', // Make legend text bolder
          },
        },
      },
      title: {
        display: false,
        text: `${countryName} - Products distribution over Category`,
        position: 'top',
        font: {
          size: 16,
        },
      },
      datalabels: {
        formatter: (value, context) => {
          const dataset = context.dataset;
          const total = dataset.data.reduce((previousValue, currentValue, currentIndex, array) => {
            return previousValue + currentValue;
          });
          const percentage = Math.round((value / total) * 100);
          return `${context.chart.data.labels[context.dataIndex]}: ${value} (${percentage}%)`;
        },
        color: '#fff',
        font: {
          weight: 'bold', // Make label text bolder
        },
      },
    },
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.canvas.parentNode.style.height = "400px";
      chartRef.current.canvas.parentNode.style.width = "400px";
    }
  }, [chartRef]);

  return (
    <div className="pie-chart-container">
      <div className="pie-chart-inner">
        <Pie ref={chartRef} data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
};

export default GeoMapPieChart;