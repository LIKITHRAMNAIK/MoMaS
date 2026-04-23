import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};

function TransactionList({ refresh }) {
  const navigate = useNavigate();
  const [showNoDuePopup, setShowNoDuePopup] = useState(false);

  const [data, setData] = useState([]);
  const [selectedName, setSelectedName] = useState('all');

  // 🔥 NEW STATES
  const [filterType, setFilterType] = useState('upcoming');
  const [sortType, setSortType] = useState('date');

  const [extendId, setExtendId] = useState(null);
  const [extendForm, setExtendForm] = useState({
    new_due_date: '',
    extra_interest: 0,
    interest_paid: false
  });

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
          tx.person_name.toLowerCase(),   // key (same for siddu/Siddu)
          tx.person_name                 // value (display)
        ])
      ).values()
    )
  ];

  useEffect(() => {
    fetchData();
  }, [refresh]);

  useEffect(() => {
    if (showNoDuePopup) {
      alert("🎉 No overdue payments!");
      setShowNoDuePopup(false);
    }
  }, [showNoDuePopup]);

  useEffect(() => {
    if (filterType === 'due') {
      const dueData = data.filter(tx => new Date(tx.due_date) < new Date());
  
      if (dueData.length === 0) {
        alert("🎉 No overdue payments!");
      }
    }
  }, [filterType, data]);

  const handlePaid = async (id) => {
    await API.put(`/paid/${id}`);
    fetchData();
    if (refresh) refresh();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this transaction?")) {
      await API.delete(`/delete/${id}`);
      fetchData();
      if (refresh) refresh();
    }
  };

  const handleEdit = async (tx) => {
    const newPrincipal = prompt("Enter Principal", tx.principal_amount);
    if (newPrincipal === null) return;

    const newInterest = prompt("Enter Interest", tx.base_interest);
    if (newInterest === null) return;

    await API.put(`/update/${tx._id}`, {
      principal_amount: Number(newPrincipal),
      base_interest: Number(newInterest)
    });

    fetchData();
    if (refresh) refresh();
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
    if (refresh) refresh();
  };

  // 🔥 FILTER LOGIC
  let filteredData = [...data];
  const today = new Date();
  
  if (selectedName !== 'all') {
    filteredData = filteredData.filter(tx => tx.person_name.toLowerCase() === selectedName.toLowerCase());
  }
  
  if (filterType === 'pending') {
    filteredData = filteredData.filter(tx => tx.status !== 'paid');
  }
  
  if (filterType === 'paid') {
    filteredData = filteredData.filter(tx => tx.status === 'paid');
  }
  
  if (filterType === 'extended') {
    filteredData = filteredData.filter(tx => tx.extensions.length > 0);
  }
  
  if (filterType === 'due') {
    const dueData = filteredData.filter(tx => new Date(tx.due_date) < today);
  
    filteredData = dueData;
  }

  // 🔥 SORT LOGIC (independent)
  if (sortType === 'name') {
    filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
  }

  // ALWAYS sort by date first (default behavior)
filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

// THEN apply custom sort
if (sortType === 'name') {
  filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
}

  // 🔥 CARD RENDER
  const renderCard = (tx) => {
    let totalInterest = 0;

    if (tx.extensions.length === 0) {
      totalInterest = tx.base_interest;
    } else {
      const lastExt = tx.extensions[tx.extensions.length - 1];

      if (lastExt.interest_paid) {
        totalInterest = lastExt.extra_interest;
      } else {
        totalInterest = tx.base_interest;
        tx.extensions.forEach(ext => {
          totalInterest += ext.extra_interest;
        });
      }
    }

    const total = tx.principal_amount + totalInterest;

    const due = new Date(tx.due_date);
    const diff = (today - due) / (1000 * 60 * 60 * 24);
    const overdueDays = diff > 0 ? Math.floor(diff) : 0;

    const isExtended = tx.extensions.length > 0;
    const lastExt = tx.extensions[tx.extensions.length - 1];

    return (

      
      <div key={tx._id} style={{
        padding: 12,
        borderRadius: 10,
        background: overdueDays > 0 ? '#ffcccc' : getColor(tx.person_name),
        fontSize: 14
      }}>
        <p style={{ color: 'blue', cursor: 'pointer' }}
          onClick={() => navigate(`/profile/${tx.person_name}`)}>
          {tx.person_name}
        </p>

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

        <button onClick={() => handlePaid(tx._id)}>Paid</button>
        <button onClick={() => setExtendId(tx._id)}>Extend</button>
        <button onClick={() => handleEdit(tx)}>Edit</button>
        <button onClick={() => handleDelete(tx._id)}>Delete</button>

        {extendId === tx._id && (
          <div>
            <input type="date"
              onChange={(e) =>
                setExtendForm({ ...extendForm, new_due_date: e.target.value })
              }
            />

            <input type="number"
              onChange={(e) =>
                setExtendForm({
                  ...extendForm,
                  extra_interest: Number(e.target.value)
                })
              }
            />

            <label>
              <input type="checkbox"
                onChange={(e) =>
                  setExtendForm({
                    ...extendForm,
                    interest_paid: e.target.checked
                  })
                }
              />
              Interest Paid
            </label>

            <button onClick={() => handleExtend(tx._id)}>Submit</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>

<select onChange={(e) => setSelectedName(e.target.value)}>
  <option value="all">All Users</option>
  {names.slice(1).map(name => (
    <option key={name} value={name}>
      {name}
    </option>
  ))}
</select>

      {/* 🔥 FILTER */}
      <div style={{
  display: 'flex',
  gap: '12px',
  marginTop: '10px',
  marginBottom: '15px',
  flexWrap: 'wrap'
}}>
  {/* 🔥 FILTER */}
  <select onChange={(e) => setFilterType(e.target.value)}>
    <option value="upcoming">Upcoming (Default)</option>
    <option value="pending">Pending Only</option>
    <option value="paid">Paid Only</option>
    <option value="extended">Extended</option>
    <option value="due">Overdue</option>
  </select>

  {/* 🔥 SORT */}
  <select onChange={(e) => setSortType(e.target.value)}>
    <option value="date">Sort by Date</option>
    <option value="name">Sort by Name</option>
  </select>
</div>

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