import React from 'react';
import {
  Bar,
  Line,
  Pie
} from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,        // ✅ ADD THIS
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,   // ✅ ADD THIS
  Title,
  Tooltip,
  Legend
);

function Charts({ data }) {

  const barData = {
    labels: ['Incoming', 'Outgoing'],
    datasets: [
      {
        label: 'Amount',
        data: [data.incoming, data.outgoing],
        backgroundColor: ['#4CAF50', '#F44336'],   // ✅ green + red
        borderRadius: 10
      }
    ]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };
  

  const lineData = {
    labels: ['Start', 'Now'],
    datasets: [
      {
        label: 'Profit Trend',
        data: [0, data.incoming - data.outgoing],
        borderColor: '#3F51B5',   // ✅ blue
        backgroundColor: 'rgba(63,81,181,0.2)',
        tension: 0.4
      }
    ]
  };

  const pieData = {
    labels: ['Principal', 'Interest'],
    datasets: [
      {
        data: [data.principal, data.interest],
        backgroundColor: ['#009688', '#FF9800']
      }
    ]
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      marginTop: '20px'
    }}>
  
      {/* 1️⃣ BAR */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        height: '320px'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          Income vs Expense
        </h3>
  
        <div style={{ height: '240px' }}>
          <Bar data={barData} options={{ ...options, maintainAspectRatio: false }} />
        </div>
      </div>
  
      {/* 2️⃣ LINE */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        height: '320px'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          Profit Trend
        </h3>
  
        <div style={{ height: '240px' }}>
          <Line data={lineData} options={{ ...options, maintainAspectRatio: false }} />
        </div>
      </div>
  
      {/* 3️⃣ PIE */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        height: '320px'
      }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
          Principal vs Interest
        </h3>
  
        <div style={{ height: '240px' }}>
          <Pie data={pieData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
  
    </div>
  );
}

export default Charts;