import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};

function TransactionList({ refresh }) {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [selectedName, setSelectedName] = useState('all');

  const [filterType, setFilterType] = useState('upcoming');
  const [sortType, setSortType] = useState('date');

  const [extendId, setExtendId] = useState(null);
  const [showNoDuePopup, setShowNoDuePopup] = useState(false);
  const [extendForm, setExtendForm] = useState({
    new_due_date: '',
    extra_interest: 0,
    interest_paid: false
  });
  const [editId, setEditId] = useState(null);
const [editForm, setEditForm] = useState({
  principal_amount: 0,
  base_interest: 0,
  start_date: '',
  due_date: ''
});

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

  const handleEdit = async (tx) => {
    const newPrincipal = prompt("Enter Principal", tx.principal_amount);
    if (newPrincipal === null) return;
  
    const newInterest = prompt("Enter Interest", tx.base_interest);
    if (newInterest === null) return;
  
    const newStartDate = prompt(
      "Enter Start Date (YYYY-MM-DD)",
      tx.start_date?.slice(0, 10)
    );
    if (newStartDate === null) return;
  
    const newDueDate = prompt(
      "Enter Due Date (YYYY-MM-DD)",
      tx.due_date?.slice(0, 10)
    );
    if (newDueDate === null) return;
  
    await API.put(`/update/${tx._id}`, {
      principal_amount: Number(newPrincipal),
      base_interest: Number(newInterest),
      start_date: newStartDate,
      due_date: newDueDate
    });
  
    fetchData();
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

  if (selectedName !== 'all') {
    filteredData = filteredData.filter(
      tx => tx.person_name.toLowerCase() === selectedName.toLowerCase()
    );
  }

  if (filterType === 'pending' || filterType === 'upcoming') {
    filteredData = filteredData.filter(tx => tx.status !== 'paid');
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
  filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

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
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: overdueDays > 0 ? '#ffcccc' : getColor(tx.person_name),
        fontSize: 14
      }}>
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
        {extendId === tx._id && (
  <div style={{ marginTop: 5 }}>
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

    <label>
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

    <button onClick={() => handleExtend(tx._id)}>Submit</button>
  </div>
)}
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
{editId === tx._id && (
  <div style={{ marginTop: 5 }}>

    <input
      type="number"
      value={editForm.principal_amount}
      onChange={(e) =>
        setEditForm({ ...editForm, principal_amount: e.target.value })
      }
    />

    <input
      type="number"
      value={editForm.base_interest}
      onChange={(e) =>
        setEditForm({ ...editForm, base_interest: e.target.value })
      }
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

    <button onClick={async () => {
      await API.put(`/update/${tx._id}`, {
        ...editForm,
        principal_amount: Number(editForm.principal_amount),
        base_interest: Number(editForm.base_interest)
      });

      setEditId(null);
      fetchData();
    }}>
      Save
    </button>

  </div>
)}
        <button onClick={() => handleDelete(tx._id)}>Delete</button>
      </div>
    );
  };

  return (
    <div>
  
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
        <span style={badgeStyle('#ff9800')}>Pending: {pendingCount}</span>
        <span style={badgeStyle('#4caf50')}>Paid: {paidCount}</span>
        <span style={badgeStyle('#2196f3')}>Extended: {extendedCount}</span>
        <span style={badgeStyle('#f44336')}>Due: {dueCount}</span>
      </div>
  
      {/* USER FILTER */}
      <select onChange={(e) => setSelectedName(e.target.value)}>
        <option value="all">All Users</option>
        {names.slice(1).map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
  
      {/* FILTER + SORT */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
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