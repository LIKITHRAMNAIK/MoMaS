import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const calculateTotal = (tx, uptoIndex) => {
    let totalInterest = tx.base_interest;
  
    for (let i = 0; i <= uptoIndex; i++) {
      const ext = tx.extensions[i];
  
      if (ext.interest_paid) {
        // keep principal + ONLY new interest
        totalInterest = ext.extra_interest;
      } else {
        totalInterest += ext.extra_interest;
      }
    }
  
    return tx.principal_amount + totalInterest;
  };
  const handleUserExport = () => {

    const rows = [];
  
    const sortedData = data.transactions
  .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
    sortedData.forEach((tx, index, arr) => {
  
      let totalInterest = tx.base_interest;
      tx.extensions.forEach(ext => {
        totalInterest += ext.extra_interest;
      });
  
      const total = tx.principal_amount + totalInterest;
  
      // 🔹 ORIGINAL
      rows.push({
        Name: tx.person_name,
        Type: tx.type,
        Stage: 'Original',
        Principal: tx.principal_amount.toLocaleString('en-IN'),
        Start: new Date(tx.start_date).toLocaleDateString('en-GB'),
        Due: new Date(
          tx.extensions.length > 0
            ? tx.extensions[0].old_due_date
            : tx.due_date
        ).toLocaleDateString('en-GB'),
        Interest: tx.base_interest.toLocaleString('en-IN'),
        Total: (tx.principal_amount + tx.base_interest).toLocaleString('en-IN'),
        Status: tx.status
      });
  
      // 🔹 EXTENSIONS
      tx.extensions.forEach((ext, i) => {
        rows.push({
          Name: tx.person_name,
          Type: tx.type,
          Stage: `Extended ${i + 1}`,
          Principal: tx.principal_amount.toLocaleString('en-IN'),
          Start: new Date(ext.old_due_date).toLocaleDateString('en-GB'),
          Due: new Date(
            i === tx.extensions.length - 1
              ? tx.due_date
              : tx.extensions[i + 1].old_due_date
          ).toLocaleDateString('en-GB'),
          Interest: ext.extra_interest.toLocaleString('en-IN'),
          Total: calculateTotal(tx, i).toLocaleString('en-IN'),
  Status: 'extended'
        });
      });
  
      // 🔥 EMPTY ROW PER TRANSACTION
      const nextTx = arr[index + 1];
      if (!nextTx || nextTx._id !== tx._id) {
        rows.push({
          Name: '',
          Type: '',
          Stage: '',
          Principal: '',
          Start: '',
          Due: '',
          Interest: '',
          Status: ''
        });
      }
  
    });
  
    // 🔥 USER TOTAL ROW
    let totalAmount = 0;
  
    data.transactions.forEach(tx => {
      let totalInterest = tx.base_interest;
      tx.extensions.forEach(ext => {
        totalInterest += ext.extra_interest;
      });
  
      totalAmount += tx.principal_amount + totalInterest;
    });
  
    rows.push({
      Name: 'TOTAL',
      Type: '',
      Stage: '',
      Principal: '',
      Start: '',
      Due: '',
      Interest: '',
      Status: `₹${totalAmount.toLocaleString('en-IN')}`
    });
  
    const csv =
      "Name,Type,Stage,Principal,Start,Due,Interest,Total,Status\n" +
      rows.map(r =>
        Object.values(r)
          .map(val => `"${val}"`)
          .join(",")
      ).join("\n");
  
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
  
    const fileName = data.name || 'user';
a.download = `${fileName}-transactions.csv`;
  
    a.click();
  };

  const handleUserPDF = () => {
    const doc = new jsPDF();
  
    const rows = [];
  
    data.transactions.forEach(tx => {
  
      rows.push([
        tx.person_name,
        tx.type,
        'Original',
        tx.principal_amount.toLocaleString('en-IN'),
        new Date(tx.start_date).toLocaleDateString('en-GB'),
        new Date(tx.due_date).toLocaleDateString('en-GB'),
        tx.base_interest.toLocaleString('en-IN'),
        (tx.principal_amount + tx.base_interest).toLocaleString('en-IN'),
tx.status
      ]);
  
      tx.extensions.forEach((ext, i) => {
        rows.push([
          tx.person_name,
          tx.type,
          `Extended ${i + 1}`,
          tx.principal_amount.toLocaleString('en-IN'),
          new Date(ext.old_due_date).toLocaleDateString('en-GB'),
          new Date(tx.due_date).toLocaleDateString('en-GB'),
          ext.extra_interest.toLocaleString('en-IN'),
calculateTotal(tx, i).toLocaleString('en-IN'),
'extended'
        ]);
      });
  
      rows.push(['', '', '', '', '', '', '', '']);
    });
  
    autoTable(doc, {
      head: [['Name', 'Type', 'Stage', 'Principal', 'Start', 'Due', 'Interest', 'Total', 'Status']],
      body: rows
    });
  
    doc.save(`${name}-transactions.pdf`);
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <p style={{ fontWeight: 'bold', color: 'blue', margin: 0 }}>
    {tx.person_name}
  </p>

  <span style={{
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    background: tx.type === 'incoming' ? '#4CAF50' : '#F44336'
  }}>
    {tx.type === 'incoming' ? 'IN' : 'OUT'}
  </span>
</div>

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

      <button
  onClick={handleUserExport}
  style={{
    marginTop: 10,
    marginBottom: 10,
    padding: '8px 12px',
    cursor: 'pointer'
  }}
>
  Export This User
</button>
<button
  onClick={handleUserPDF}
  style={{
    marginBottom: 10,
    padding: '8px 12px',
    cursor: 'pointer'
  }}
>
  Export PDF
</button>

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