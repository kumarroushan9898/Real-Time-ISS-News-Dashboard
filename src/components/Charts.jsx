import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calculateSpeed } from '../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function Charts({ data, type }) {
  if (!data || data.length < 2) {
    return <div className="h-full flex items-center justify-center text-gray-500">Waiting for more data...</div>;
  }

  const speeds = [];
  const labels = [];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const spd = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, prev.timestamp, curr.timestamp);
    speeds.push(spd);
    
    const d = new Date(curr.timestamp * 1000);
    labels.push(`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`);
  }

  const chartData = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Speed (km/h)',
        data: speeds,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
  };

  return <Line options={options} data={chartData} />;
}
