import React, { useState,useEffect } from 'react';
import API from '../services/api';

function AddTransaction({ refresh }) {
  const [names, setNames] = useState([]);
  const [form, setForm] = useState({
    person_name: '',
    type: 'incoming',
    principal_amount: '',
    base_interest: '',
    start_date: '',
    due_date: '',
    notes: ''
  });
  useEffect(() => {
    API.get('/')
      .then(res => {
        const unique = [
          ...new Set(res.data.map(tx => tx.person_name))
        ];
        setNames(unique);
      })
      .catch(err => console.log(err));
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // ✅ ONLY CHANGE: Auto capitalize name
    if (name === 'person_name') {
      value = value
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post('/add', {
        person_name: form.person_name.trim(),
        type: form.type,
        principal_amount: Number(form.principal_amount),
        base_interest: Number(form.base_interest),
        start_date: form.start_date,
        due_date: form.due_date,
        notes: form.notes
      });

      alert('Transaction Added ✅');

      setForm({
        person_name: '',
        type: 'incoming',
        principal_amount: '',
        base_interest: '',
        start_date: '',
        due_date: '',
        notes: ''
      });

      refresh();

    } catch (err) {
      console.log(err);
      alert('Error ❌');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
      <h3>Add Transaction</h3>

      <input
  list="names"
  name="person_name"
  placeholder="Name"
  value={form.person_name}
  onChange={handleChange}
  required
/>

<datalist id="names">
  {names.map((n, i) => (
    <option key={i} value={n} />
  ))}
</datalist><br /><br />

      <select name="type" value={form.type} onChange={handleChange}>
        <option value="incoming">Incoming</option>
        <option value="outgoing">Outgoing</option>
      </select><br /><br />

      <input
        type="number"
        name="principal_amount"
        placeholder="Principal"
        value={form.principal_amount}
        onChange={handleChange}
        step="100"
        min="0"
        required
      />

      <input
        type="number"
        name="base_interest"
        placeholder="Interest"
        value={form.base_interest}
        onChange={handleChange}
        step="100"
        min="0"
        required
      />

      <input
        type="date"
        name="start_date"
        value={form.start_date}
        onChange={handleChange}
        required
      /><br /><br />

      <input
        type="date"
        name="due_date"
        value={form.due_date}
        onChange={handleChange}
        required
      /><br /><br />

      <input
        name="notes"
        placeholder="Notes"
        value={form.notes}
        onChange={handleChange}
      /><br /><br />

      <button type="submit">Add</button>
    </form>
  );
}

export default AddTransaction;