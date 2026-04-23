import React, { useEffect, useState } from 'react';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';

const card = (color) => ({
  background: color,
  color: 'white',
  padding: '20px',
  borderRadius: '10px',
  textAlign: 'center',
  fontWeight: 'bold'
});

function Dashboard() {
  const [data, setData] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [reload, setReload] = useState(false); // ✅ FIXED POSITION

  const fetchData = () => {
    API.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>💰 Money Dashboard</h1>

      {/* ADD BUTTON */}
      <button
        onClick={() => setOpenForm(true)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '12px 18px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        +
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
            <h3>Add Transaction</h3>

            <AddTransaction
              refresh={() => {
                fetchData();
                setReload(prev => !prev); // ✅ TRIGGER LIST UPDATE
                setOpenForm(false);
              }}
            />

            <button
              onClick={() => setOpenForm(false)}
              style={{
                marginTop: '10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
          marginTop: '30px'
        }}
      >
        <div style={card('#4CAF50')}>
          <h3>Incoming</h3>
          <p>{data.incoming}</p>
        </div>

        <div style={card('#F44336')}>
          <h3>Outgoing</h3>
          <p>{data.outgoing}</p>
        </div>

        <div
  style={{
    ...card((data.incoming - data.outgoing) >= 0 ? '#3F51B5' : '#F44336'),
    gridColumn: 'span 2'
  }}
>
  <h3>Total</h3>
  <p>{data.incoming - data.outgoing}</p>
</div>

        <div style={card('#009688')}>
          <h3>Principal</h3>
          <p>{data.principal}</p>
        </div>

        <div style={card('#FF9800')}>
          <h3>Interest</h3>
          <p>{data.interest}</p>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <TransactionList refresh={reload} />
    </div>
  );
}

export default Dashboard;