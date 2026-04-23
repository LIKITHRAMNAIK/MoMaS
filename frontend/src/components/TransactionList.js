import React, { useEffect, useState } from 'react';
import API from '../services/api';

const getColor = (name) => {
  const colors = ['#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0'];
  return colors[name.charCodeAt(0) % colors.length];
};

const getUrgencyColor = (date) => {
  const today = new Date();
  const due = new Date(date);

  const diff = (due - today) / (1000 * 60 * 60 * 24);

  if (diff < 0) return '#ffcccc';        // overdue 🔴
  if (diff <= 2) return '#fff3cd';       // near ⚠️
  return null;
};

function TransactionList({ refresh }) {
  const [data, setData] = useState([]);
  const [extendId, setExtendId] = useState(null);
  const [sortType, setSortType] = useState('date'); // ✅ default
  const [filterName, setFilterName] = useState('all');

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

  
  useEffect(() => {
    fetchData();
  }, [refresh]);

  const handlePaid = async (id) => {
    await API.put(`/paid/${id}`);
    await fetchData();
    refresh();
  };

  const handleExtend = async (id) => {
    await API.put(`/extend/${id}`, extendForm);

    setExtendForm({
      new_due_date: '',
      extra_interest: 0,
      interest_paid: false
    });

    setExtendId(null);
    await fetchData();
    refresh();
  };

  // 🔥 UNIQUE NAMES
  const names = ['all', ...new Set(data.map(tx => tx.person_name))];

  // 🔥 FILTER
  let filteredData = filterName === 'all'
    ? data
    : data.filter(tx => tx.person_name === filterName);

  // 🔥 DEFAULT SORT (UPCOMING FIRST)
  filteredData.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // 🔥 OPTIONAL NAME SORT
  if (sortType === 'name') {
    filteredData.sort((a, b) => a.person_name.localeCompare(b.person_name));
  }

  return (
    <div style={{ marginTop: 40 }}>

      {/* FILTER + SORT */}
      <div style={{ display: 'flex', gap: 10 }}>
        <select onChange={(e) => setFilterName(e.target.value)}>
          {names.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select onChange={(e) => setSortType(e.target.value)}>
          <option value="date">Upcoming (Default)</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '15px',
        marginTop: 20
      }}>

        {filteredData.map(tx => {

          let totalInterest = 0;

          if (tx.extensions.length === 0) {
            totalInterest = tx.base_interest;
          } else {
            const lastExtension = tx.extensions[tx.extensions.length - 1];

            if (lastExtension.interest_paid) {
              totalInterest = lastExtension.extra_interest;
            } else {
              totalInterest = tx.base_interest;
              tx.extensions.forEach(ext => {
                totalInterest += ext.extra_interest;
              });
            }
          }

          const total = tx.principal_amount + totalInterest;

          const isExtended = tx.extensions.length > 0;
          const lastExt = tx.extensions[tx.extensions.length - 1];

          const originalDue = isExtended && lastExt.old_due_date
            ? new Date(lastExt.old_due_date).toDateString()
            : new Date(tx.due_date).toDateString();

          const newDate = new Date(tx.due_date).toDateString();

          const urgency = getUrgencyColor(tx.due_date);

          return (
            <div
              key={tx._id}
              style={{
                padding: 15,
                borderRadius: 10,
                background: urgency || getColor(tx.person_name),
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <p style={{ fontWeight: 'bold' }}>{tx.person_name}</p>

  <button
    style={{
      fontSize: '12px',
      padding: '3px 6px',
      cursor: 'pointer'
    }}
    onClick={() => window.location.href = `/profile/${tx.person_name}`}
  >
    Profile
  </button>
</div>

              <p>
                Due:
                {isExtended ? (
                  <>
                    <span style={{ textDecoration: 'line-through', marginLeft: 5 }}>
                      {originalDue}
                    </span>
                    <span style={{ color: 'green', marginLeft: 5 }}>
                      {newDate}
                    </span>
                  </>
                ) : newDate}
              </p>

              <p
  style={{
    color:
      tx.status === 'paid'
        ? 'green'
        : tx.status === 'pending'
        ? 'red'
        : 'orange'
  }}
>
  Status: {tx.status}
</p>

              <p>Principal: ₹{tx.principal_amount}</p>
              <p style={{ color: 'orange' }}>Interest: ₹{totalInterest}</p>

              <p style={{ color: tx.type === 'incoming' ? 'green' : 'red' }}>
                <b>Total: ₹{total}</b>
              </p>

              <button onClick={() => handlePaid(tx._id)}>Paid</button>
              <button onClick={() => setExtendId(tx._id)}>Extend</button>

              {extendId === tx._id && (
                <div>
                  <input
                    type="date"
                    onChange={(e) =>
                      setExtendForm({ ...extendForm, new_due_date: e.target.value })
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
                    Interest Paid
                  </label>

                  <button onClick={() => handleExtend(tx._id)}>Submit</button>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default TransactionList;