import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};

function TransactionList({ refresh }) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [selectedName, setSelectedName] = useState('all');

  const [filterType, setFilterType] = useState('upcoming');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [sortType, setSortType] = useState('date');

  // ✅ EDIT STATE
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    principal_amount: 0,
    base_interest: 0,
    start_date: '',
    due_date: ''
  });

  // ✅ EXTEND STATE
  const [extendId, setExtendId] = useState(null);
  const [extendForm, setExtendForm] = useState({
    new_due_date: '',
    extra_interest: 0,
    interest_paid: false
  });

  // ✅ POPUP STATE
  const [showNoDuePopup, setShowNoDuePopup] = useState(false);

  const today = new Date();

  const badgeStyle = (bg) => ({
    background: bg,
    color: 'white',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  });

  // ✅ COUNTS
  const pendingCount = data.filter(tx => tx.status !== 'paid').length;
  const paidCount = data.filter(tx => tx.status === 'paid').length;
  const extendedCount = data.filter(tx => tx.extensions.length > 0).length;
  const dueCount = data.filter(
    tx => new Date(tx.due_date) < today && tx.status !== 'paid'
  ).length;

  const totalDueAmount = data
  .filter(tx => new Date(tx.due_date) < today && tx.status !== 'paid')
  .reduce((sum, tx) => {
    let totalInterest = tx.base_interest;

    tx.extensions.forEach(ext => {
      totalInterest += ext.extra_interest;
    });

    return sum + tx.principal_amount + totalInterest;
  }, 0);

  const fetchData = () => {
    API.get('/')
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  };

  const names = [
    'All Users',
    ...Array.from(
      new Map(
        data.map(tx => [
          tx.person_name.toLowerCase(),
          tx.person_name
        ])
      ).values()
    )
  ];

  useEffect(() => {
    fetchData();
  }, [refresh]);

  useEffect(() => {
    if (filterType === 'due' && dueCount === 0) {
      setShowNoDuePopup(true);
  
      setTimeout(() => {
        setShowNoDuePopup(false);
      }, 2000);
    }
  }, [filterType, dueCount]);

  // ✅ ACTIONS
  const handlePaid = async (id) => {
    await API.put(`/paid/${id}`);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await API.delete(`/delete/${id}`);
      fetchData();
    }
  };

  const handleExport = () => {

    const rows = [];
  
    const filteredSortedData = [...data]
  .filter(tx => {
        if (!selectedMonth) return true;
        const txDate = new Date(tx.start_date);
        return txDate.toISOString().slice(0, 7) === selectedMonth;
      })
      .sort((a, b) => {
        if (a.person_name !== b.person_name) {
          return a.person_name.localeCompare(b.person_name);
        }
        return new Date(a.start_date) - new Date(b.start_date);
      });
  
    filteredSortedData.forEach((tx, index, arr) => {
  
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
  
      // 🔥 EMPTY ROW (ONLY ONCE)
      const nextTx = arr[index + 1];

// 🔥 NEW LOGIC: group by transaction (not just user)
if (
  !nextTx ||
  nextTx.person_name !== tx.person_name ||   // different user
  nextTx._id !== tx._id                     // different transaction
) {
  rows.push({
    Name: '',
    Type: '',
    Stage: '',
    Principal: '',
    Start: '',
    Due: '',
    Interest: '',
    Total: '',
    Status: ''
  });
}
  
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
  
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
  
    a.download = `transactions-${monthName}-${year}.csv`;
    a.click();
  };
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
  const handleExportPDF = () => {
    const doc = new jsPDF();
  
    const rows = [];
  
    const filteredSortedData = [...data]
  .sort((a, b) => {
        if (a.person_name !== b.person_name) {
          return a.person_name.localeCompare(b.person_name);
        }
        return new Date(a.start_date) - new Date(b.start_date);
      });
  
    filteredSortedData.forEach((tx) => {
  
      // ORIGINAL
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
  
      // EXTENSIONS
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
  
      // EMPTY ROW
      rows.push(['', '', '', '', '', '', '', '', '']);
      });
  
    autoTable(doc, {
      head: [['Name', 'Type', 'Stage', 'Principal', 'Start', 'Due', 'Interest', 'Total', 'Status']],
      body: rows
    });
  
    doc.save('transactions.pdf');
  };

  const handleExtend = async (id) => {
    await API.put(`/extend/${id}`, extendForm);

    setExtendForm({
      new_due_date: '',
      extra_interest: 0,
      interest_paid: false
    });

    setExtendId(null);
    fetchData();
  };

  // ✅ FILTER LOGIC
  let filteredData = [...data];

// FIRST filter by user
if (selectedName !== 'all') {
  filteredData = filteredData.filter(
    tx => tx.person_name.toLowerCase() === selectedName.toLowerCase()
  );
}

// THEN month

if (selectedMonth) {
  filteredData = filteredData.filter(tx => {
    const txDate = new Date(tx.start_date);
    const month = txDate.toISOString().slice(0, 7);
    return month === selectedMonth;
  });
}

if (filterType === 'pending') {
  filteredData = filteredData.filter(tx => tx.status !== 'paid');
}

if (filterType === 'upcoming') {
  filteredData = filteredData.filter(
    tx => new Date(tx.due_date) >= today && tx.status !== 'paid'
  );
}

  if (filterType === 'paid') {
    filteredData = filteredData.filter(tx => tx.status === 'paid');
  }

  if (filterType === 'extended') {
    filteredData = filteredData.filter(tx => tx.extensions.length > 0);
  }

  if (filterType === 'due') {
    filteredData = filteredData.filter(
      tx => new Date(tx.due_date) < today && tx.status !== 'paid'
    );
  }

  // SORT
  if (sortType === 'date') {
    filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }
  
  if (sortType === 'name') {
    filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
  }

  // ✅ CARD
  const renderCard = (tx) => {
    let totalInterest = tx.base_interest;

    tx.extensions.forEach(ext => {
      totalInterest += ext.extra_interest;
    });

    const total = tx.principal_amount + totalInterest;

    const due = new Date(tx.due_date);
    const overdueDays = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));

    return (
      
      <div
  key={tx._id}
  style={{
    padding: '12px',
    borderRadius: '10px',
    background:
      overdueDays > 0
        ? '#ffcccc'
        : tx.status === 'paid'
        ? '#e8f5e9'
        : '#fff3cd',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
  }}
>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontWeight: 'bold', color: 'blue', cursor: 'pointer', margin: 0 }}
             onClick={() => navigate(`/profile/${tx.person_name}`)}>
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
  {tx.extensions.length > 0 ? (
    <>
      <span style={{ textDecoration: 'line-through', marginLeft: 5 }}>
        {new Date(tx.extensions[tx.extensions.length - 1].old_due_date).toDateString()}
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

        <p>Status: {tx.status}</p>
        <p>₹{tx.principal_amount}</p>
        <p>Interest ₹{totalInterest}</p>
        <p><b>Total ₹{total}</b></p>

        <button onClick={() => handlePaid(tx._id)}>Paid</button>
        <button onClick={() => setExtendId(tx._id)}>Extend</button>
        <button onClick={() => {
  setEditId(tx._id);
  setEditForm({
    principal_amount: tx.principal_amount,
    base_interest: tx.base_interest,
    start_date: tx.start_date?.slice(0,10),
    due_date: tx.due_date?.slice(0,10)
  });
}}>
  Edit
</button>
        <button onClick={() => handleDelete(tx._id)}>Delete</button>
      </div>
    );
  };

  return (
    
    <div>

{extendId && (
  <div
    onClick={() => setExtendId(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
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
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >
      <h3>Extend Transaction</h3>

      <input
        type="date"
        onChange={(e) =>
          setExtendForm({
            ...extendForm,
            new_due_date: e.target.value
          })
        }
      />

      <input
        type="number"
        placeholder="Extra Interest"
        onChange={(e) =>
          setExtendForm({
            ...extendForm,
            extra_interest: Number(e.target.value)
          })
        }
      />

      <label style={{ display: 'block', marginTop: 5 }}>
        <input
          type="checkbox"
          onChange={(e) =>
            setExtendForm({
              ...extendForm,
              interest_paid: e.target.checked
            })
          }
        />
        Last Interest Paid
      </label>

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button
          onClick={async () => {
            await API.put(`/extend/${extendId}`, extendForm);
            setExtendId(null);
            fetchData();
          }}
        >
          Save
        </button>

        <button onClick={() => setExtendId(null)}>Cancel</button>
      </div>
    </div>
  </div>
)}

      {editId && (
  <div
    onClick={() => setEditId(null)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.4)',
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
        padding: 20,
        borderRadius: 10,
        width: 300
      }}
    >
      <h3>Edit Transaction</h3>

      <input
        type="number"
        value={editForm.principal_amount}
        onChange={(e) =>
          setEditForm({ ...editForm, principal_amount: e.target.value })
        }
        placeholder="Principal"
      />

      <input
        type="number"
        value={editForm.base_interest}
        onChange={(e) =>
          setEditForm({ ...editForm, base_interest: e.target.value })
        }
        placeholder="Interest"
      />

      <input
        type="date"
        value={editForm.start_date}
        onChange={(e) =>
          setEditForm({ ...editForm, start_date: e.target.value })
        }
      />

      <input
        type="date"
        value={editForm.due_date}
        onChange={(e) =>
          setEditForm({ ...editForm, due_date: e.target.value })
        }
      />

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button
          onClick={async () => {
            await API.put(`/update/${editId}`, {
              ...editForm,
              principal_amount: Number(editForm.principal_amount),
              base_interest: Number(editForm.base_interest)
            });

            setEditId(null);
            fetchData();
          }}
        >
          Save
        </button>

        <button onClick={() => setEditId(null)}>Cancel</button>
      </div>
    </div>
  </div>
)}
      {/* 🔥 POPUP (ADD HERE — TOP INSIDE RETURN) */}
      {showNoDuePopup && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#4CAF50',
          color: 'white',
          padding: '10px 15px',
          borderRadius: 8,
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
          zIndex: 999
        }}>
          🎉 No overdue payments
        </div>
      )}
  
      {/* 🔥 BADGES */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '10px'
      }}>
        {/* <span style={badgeStyle('#ff9800')}>Pending: {pendingCount}</span> */}
        <span
  onClick={() => setFilterType('pending')}
  style={{
    ...badgeStyle('#ff9800'),
    cursor: 'pointer',
    border: filterType === 'pending' ? '2px solid black' : 'none'
  }}
>
  Pending: {pendingCount}
</span>
        {/* <span style={badgeStyle('#4caf50')}>Paid: {paidCount}</span>
        <span style={badgeStyle('#2196f3')}>Extended: {extendedCount}</span>
        <span style={badgeStyle('#f44336')}>Due: {dueCount}</span> */}

<span
  onClick={() => setFilterType('paid')}
  style={{
    ...badgeStyle('#4caf50'),
    cursor: 'pointer',
    border: filterType === 'paid' ? '2px solid black' : 'none'
  }}
>
  Paid: {paidCount}
</span>

<span
  onClick={() => setFilterType('extended')}
  style={{
    ...badgeStyle('#2196f3'),
    cursor: 'pointer',
    border: filterType === 'extended' ? '2px solid black' : 'none'
  }}
>
  Extended: {extendedCount}
</span>

<span
  onClick={() => setFilterType('due')}
  style={{
    ...badgeStyle('#f44336'),
    cursor: 'pointer',
    border: filterType === 'due' ? '2px solid black' : 'none'
  }}
>
  Due: {dueCount}
</span>
      </div>
  
      {/* USER FILTER */}
      <select onChange={(e) => setSelectedName(e.target.value)}>
        <option value="all">All Users</option>
        {names.slice(1).map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
  
      {/* FILTER + SORT */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>

  <select onChange={(e) => setFilterType(e.target.value)}>
    <option value="upcoming">Upcoming</option>
    <option value="pending">Pending</option>
    <option value="paid">Paid</option>
    <option value="extended">Extended</option>
    <option value="due">Overdue</option>
  </select>

  <select onChange={(e) => setSortType(e.target.value)}>
    <option value="date">Sort by Date</option>
    <option value="name">Sort by Name</option>
  </select>

  {/* ✅ MONTH FILTER */}
  <input
    type="month"
    onChange={(e) => setSelectedMonth(e.target.value)}
  />

  {/* ✅ EXPORT BUTTON */}
  <button
    onClick={handleExport}
    style={{ padding: '5px 10px', cursor: 'pointer' }}
  >
    Export CSV
  </button>
<button
  onClick={handleExportPDF}
  style={{ padding: '5px 10px', cursor: 'pointer' }}
>
  Export PDF
</button>
</div>

{/* 💰 TOTAL DUE */}
<div style={{
  marginTop: 10,
  padding: 10,
  background: '#fff3cd',
  borderRadius: 10,
  fontWeight: 'bold'
}}>
  💰 Total Due: ₹{totalDueAmount}
</div>
  
      {/* CARDS */}
      {filterType === 'due' && filteredData.length === 0 && (
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
  
  <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 12,
  marginTop: 20
}}>
  {filteredData.map(renderCard)}
</div>
  
    </div>
  );
}

export default TransactionList;