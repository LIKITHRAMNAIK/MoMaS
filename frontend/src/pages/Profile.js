import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const card = (color) => ({
  background: color,
  color: 'white',
  padding: '15px',
  borderRadius: '10px',
  textAlign: 'center',
  fontWeight: 'bold'
});

function Profile() {
  const { name } = useParams();
  const navigate = useNavigate(); 
  const [data, setData] = useState(null);
  const [filterType, setFilterType] = useState('upcoming');

  const fetchData = () => {
    API.get(`/person/${name}`)
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  useEffect(() => {
    if (filterType === 'due') {
      const dueData = data?.transactions.filter(
        tx => new Date(tx.due_date) < new Date()
      );
  
      if (dueData && dueData.length === 0) {
        alert("🎉 No overdue payments!");
      }
    }
  }, [filterType, data]);

  if (!data) return <h2>Loading...</h2>;

  // 🔥 SUMMARY
  let incoming = 0;
  let outgoing = 0;

  data.transactions.forEach(tx => {
    let interest = tx.base_interest;
    tx.extensions.forEach(ext => {
      interest += ext.extra_interest;
    });

    const total = tx.principal_amount + interest;

    if (tx.type === 'incoming') incoming += total;
    else outgoing += total;
  });

  const net = incoming - outgoing;

  // 🔥 FILTER LOGIC
  let filtered = [...data.transactions];
  const today = new Date();

  if (filterType === 'paid') {
    filtered = filtered.filter(tx => tx.status === 'paid');
  }

  if (filterType === 'extended') {
    filtered = filtered.filter(tx => tx.extensions.length > 0);
  }

  if (filterType === 'due') {
    filtered = filtered.filter(tx => new Date(tx.due_date) < today);
  }

  if (filterType === 'upcoming') {
    filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }

  const renderCard = (tx) => {
    let totalInterest = tx.base_interest;

    if (tx.extensions.length > 0) {
      const lastExt = tx.extensions[tx.extensions.length - 1];

      if (lastExt.interest_paid) {
        totalInterest = lastExt.extra_interest;
      } else {
        tx.extensions.forEach(ext => {
          totalInterest += ext.extra_interest;
        });
      }
    }

    const total = tx.principal_amount + totalInterest;

    const due = new Date(tx.due_date);
    const overdueDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));

    const isExtended = tx.extensions.length > 0;
    const lastExt = tx.extensions[tx.extensions.length - 1];

    return (
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: overdueDays > 0 ? '#ffcccc' : '#fff3cd'
      }}>
        <p style={{ color: 'blue' }}>{tx.person_name}</p>

        <p>Start: {new Date(tx.start_date).toDateString()}</p>

        <p>
          Due:
          {isExtended ? (
            <>
              <span style={{ textDecoration: 'line-through' }}>
                {new Date(lastExt.old_due_date).toDateString()}
              </span>
              <span style={{ color: 'green', marginLeft: 5 }}>
                {new Date(tx.due_date).toDateString()}
              </span>
            </>
          ) : (
            new Date(tx.due_date).toDateString()
          )}
        </p>

        {overdueDays > 0 && (
          <p style={{ color: 'red' }}>Overdue: {overdueDays} days</p>
        )}

        <p>{tx.status}</p>
        <p>₹{tx.principal_amount}</p>
        <p>Interest ₹{totalInterest}</p>
        <p><b>Total ₹{total}</b></p>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <button
  onClick={() => navigate('/')}
  style={{
    marginBottom: 10,
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#3f51b5',
    color: 'white',
    cursor: 'pointer'
  }}
>
  ⬅ Back to Dashboard
</button>
      <h1>{name}'s Profile</h1>

      {/* 🔥 SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={card('#4CAF50')}>Incoming ₹{incoming}</div>
        <div style={card('#F44336')}>Outgoing ₹{outgoing}</div>
        <div style={card(net >= 0 ? '#009688' : '#D32F2F')}>
          Net ₹{net}
        </div>
      </div>

      {/* 🔥 FILTER */}
      <div style={{ marginTop: 20 }}>
        <select onChange={(e) => setFilterType(e.target.value)}>
          <option value="upcoming">Upcoming (Default)</option>
          <option value="paid">Paid</option>
          <option value="extended">Extended</option>
          <option value="due">Due / Overdue</option>
        </select>
      </div>

      {filterType === 'due' && filtered.length === 0 && (
  <div style={{
    padding: 20,
    background: '#e8f5e9',
    borderRadius: 10,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'green'
  }}>
    🎉 No overdue payments
  </div>
)}

      {/* 🔥 CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))',
        gap: 12,
        marginTop: 20
      }}>
        {filtered.map(renderCard)}
      </div>
    </div>
  );
}

export default Profile;