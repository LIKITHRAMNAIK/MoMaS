import React, { useEffect, useState } from 'react';
import API from '../services/api';

function Profile() {
  const name = window.location.pathname.split('/')[2];
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get('/')
      .then(res => {
        const filtered = res.data.filter(tx => tx.person_name === name);
        setData(filtered);
      });
  }, [name]);

  let totalInterest = 0;
  let totalPrincipal = 0;

  data.forEach(tx => {
    totalPrincipal += tx.principal_amount;

    let interest = tx.base_interest;
    tx.extensions.forEach(ext => {
      interest += ext.extra_interest;
    });

    totalInterest += interest;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>👤 {name} Profile</h2>

      <p>Total Principal: ₹{totalPrincipal}</p>
      <p>Total Interest: ₹{totalInterest}</p>
      <p>Net: ₹{totalPrincipal + totalInterest}</p>

      <hr />

      {data.map(tx => (
        <div
          key={tx._id}
          style={{
            padding: 10,
            marginBottom: 10,
            background: tx.status === 'paid' ? '#d4edda' : '#fff',
            borderRadius: 5
          }}
        >
          <p>Due: {new Date(tx.due_date).toDateString()}</p>
          <p>Status: {tx.status}</p>
          <p>Amount: ₹{tx.principal_amount}</p>
        </div>
      ))}
    </div>
  );
}

export default Profile;