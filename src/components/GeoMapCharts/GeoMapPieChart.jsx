import React, { useRef, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
          'rgba(255, 99, 132, 0.9)',    // Red
          'rgba(54, 162, 235, 0.9)',   // Blue
          'rgba(255, 206, 86, 0.9)',   // Yellow
          'rgba(75, 192, 192, 0.9)',   // Green
          'rgba(153, 102, 255, 0.9)',  // Purple
          'rgba(255, 159, 64, 0.9)',   // Orange
          'rgba(120, 200, 100, 0.9)',  // Light Green
          'rgba(200, 120, 100, 0.9)',  // Light Red
          'rgba(100, 120, 200, 0.9)',  // Light Blue
          'rgba(200, 100, 120, 0.9)',  // Light Pink
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
    <div className="relative" style={{ width: '400px', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Pie ref={chartRef} data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>
    </div>
  );
};

export default GeoMapPieChart;