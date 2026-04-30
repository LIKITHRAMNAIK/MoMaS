import React, { useEffect, useState } from 'react';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';
import Charts from '../components/Charts';
import { formatCurrency } from '../utils/format';

const card = (bg) => ({
  background: bg,
  color: 'white',
  padding: '20px',
  borderRadius: '12px',
  textAlign: 'center',
  fontWeight: '600',
  fontSize: '15px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  transition: '0.2s'
});

function Dashboard() {
  const [data, setData] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [reload, setReload] = useState(false);

  const fetchData = () => {
    API.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <h2>Loading...</h2>;
  const profitLoss = data.incoming - data.outgoing;

  const total = data.incoming + data.outgoing;

const incomingPercent =
  total === 0 ? 0 : (data.incoming / total) * 100;

const outgoingPercent =
  total === 0 ? 0 : (data.outgoing / total) * 100;

  return (
  <div style={{ padding: '30px', fontFamily: 'Arial' }}>

    <h1 style={{ textAlign: 'center' }}>💰 Money Dashboard</h1>

    {/* + BUTTON */}
    <button
      onClick={() => setOpenForm(true)}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}
    >
      + New Transaction
    </button>

    {/* POPUP */}
    {openForm && (
      <div
        onClick={() => setOpenForm(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backdropFilter: 'blur(4px)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '350px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
          }}
        >
          <AddTransaction
            refresh={() => {
              fetchData();
              setReload(prev => !prev);
              setOpenForm(false);
            }}
          />
        </div>
      </div>
    )}

    {/* DASHBOARD CARDS */}
    <div style={{
      display: 'grid',
gridTemplateColumns: 'repeat(2, 1fr)',
gap: '12px',
alignItems: 'start',
      gap: '15px',
      marginTop: '20px',
      marginBottom: '20px'
    }}>

      <div style={card('#4CAF50')}>
        <h3>Incoming</h3>
        <p>{formatCurrency(data.incoming)}</p>
      </div>

      <div style={card('#F44336')}>
        <h3>Outgoing</h3>
        <p>{formatCurrency(data.outgoing)}</p>
      </div>

      <div style={card('#009688')}>
        <h3>Principal</h3>
        <p>{formatCurrency(data.principal)}</p>
      </div>

      <div style={card('#FF9800')}>
        <h3>Interest</h3>
        <p>{formatCurrency(data.interest)}</p>
      </div>

      <div style={{
        ...card(profitLoss >= 0 ? '#009688' : '#D32F2F'),
        gridColumn: 'span 4'
      }}>
        <h3>{profitLoss >= 0 ? 'Profit' : 'Loss'}</h3>
        <p>{formatCurrency(profitLoss)}</p>
      </div>

    </div>

    {/* 🔥 PROFIT BAR (CORRECT LOCATION) */}
    <div style={{ marginTop: '10px', marginBottom: '20px' }}>

      <h3 style={{ marginBottom: 8 }}>🔥 PROFIT BAR</h3>

      <div style={{
        width: '100%',
        height: '25px',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        background: '#eee'
      }}>

        <div style={{
  width: `${incomingPercent}%`,
  background: '#4CAF50',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
}}>
  {incomingPercent > 10 && `${incomingPercent.toFixed(0)}%`}
</div>

<div style={{
  width: `${outgoingPercent}%`,
  background: '#F44336',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
}}>
  {outgoingPercent > 10 && `${outgoingPercent.toFixed(0)}%`}
</div>

      </div>

    </div>

    {/* TRANSACTIONS */}
    <TransactionList refresh={reload} />

  </div>
);
}

export default Dashboard;