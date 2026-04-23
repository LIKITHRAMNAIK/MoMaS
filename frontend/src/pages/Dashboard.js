// import React, { useEffect, useState } from 'react';
// import API from '../services/api';
// import AddTransaction from '../components/AddTransaction';
// import TransactionList from '../components/TransactionList';

// const card = (bg) => ({
//   background: bg,
//   color: 'white',
//   padding: '15px',
//   borderRadius: '12px',
//   textAlign: 'center',
//   fontWeight: '600',
//   fontSize: '14px',
//   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//   transition: '0.2s'
// });

// function Dashboard() {
//   const [data, setData] = useState(null);
//   const [openForm, setOpenForm] = useState(false);
//   const [reload, setReload] = useState(false); // ✅ FIXED POSITION

//   const fetchData = () => {
//     API.get('/dashboard')
//       .then(res => setData(res.data))
//       .catch(err => console.log(err));
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   if (!data) return <h2>Loading...</h2>;

//   return (
//     <div style={{ padding: '30px', fontFamily: 'Arial' }}>
//       <h1 style={{ textAlign: 'center' }}>💰 Money Dashboard</h1>

//       {/* ADD BUTTON */}
//       <button
//   onClick={() => setShowForm(true)}   // ✅ make sure this exists
//   style={{
//     position: 'fixed',   // 🔥 important
//     top: '20px',
//     right: '20px',
//     background: '#4CAF50',
//     color: 'white',
//     border: 'none',
//     padding: '10px 16px',
//     borderRadius: '25px',
//     cursor: 'pointer',
//     fontWeight: 'bold',
//     boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
//     zIndex: 1000   // 🔥 prevents overlap issues
//   }}
// >
//   + New Transaction
// </button>

//       {/* POPUP */}
//       {openForm && (
//         <div
//           onClick={() => setOpenForm(false)}
//           style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%',
//             backdropFilter: 'blur(4px)',
//             background: 'rgba(0,0,0,0.3)',
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             zIndex: 1000
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: 'white',
//               padding: '25px',
//               borderRadius: '12px',
//               width: '350px',
//               boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
//             }}
//           >
//             <h3>Add Transaction</h3>

//             <AddTransaction
//               refresh={() => {
//                 fetchData();
//                 setReload(prev => !prev); // ✅ TRIGGER LIST UPDATE
//                 setOpenForm(false);
//               }}
//             />

//             <button
//               onClick={() => setOpenForm(false)}
//               style={{
//                 marginTop: '10px',
//                 background: '#f44336',
//                 color: 'white',
//                 border: 'none',
//                 padding: '6px 10px',
//                 borderRadius: '5px',
//                 cursor: 'pointer'
//               }}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       {/* DASHBOARD GRID */}
//       <div style={{
//   display: 'grid',
//   gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//   gap: '15px',
//   marginBottom: '20px'
// }}>
//         <div style={card('#4CAF50')}>
//           <h3>Incoming</h3>
//           <p>{data.incoming}</p>
//         </div>

//         <div style={card('#F44336')}>
//           <h3>Outgoing</h3>
//           <p>{data.outgoing}</p>
//         </div>

//         <div
//   style={{
//     ...card((data.incoming - data.outgoing) >= 0 ? '#3F51B5' : '#F44336'),
//     gridColumn: 'span 2'
//   }}
// >
//   <h3>Total</h3>
//   <p>{data.incoming - data.outgoing}</p>
// </div>

//         <div style={card('#009688')}>
//           <h3>Principal</h3>
//           <p>{data.principal}</p>
//         </div>

//         <div style={card('#FF9800')}>
//           <h3>Interest</h3>
//           <p>{data.interest}</p>
//         </div>
//       </div>

//       {/* TRANSACTIONS */}
//       <TransactionList refresh={reload} />
//     </div>
//   );
// }

// export default Dashboard;


import React, { useEffect, useState } from 'react';
import API from '../services/api';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';

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

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>

      <h1 style={{ textAlign: 'center' }}>💰 Money Dashboard</h1>

      {/* ✅ FIXED BUTTON */}
      <button
        onClick={() => setOpenForm(true)}   // ✅ FIXED
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
            <h3>Add Transaction</h3>

            <AddTransaction
              refresh={() => {
                fetchData();
                setReload(prev => !prev);
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

      {/* ✅ FIXED GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',   // 🔥 FIXED
        gap: '15px',
        marginTop: '20px',
        marginBottom: '20px'
      }}>

        {/* ROW 1 */}
        <div style={card('#4CAF50')}>
          <h3>Incoming</h3>
          <p>{data.incoming}</p>
        </div>

        <div style={card('#F44336')}>
          <h3>Outgoing</h3>
          <p>{data.outgoing}</p>
        </div>

        <div style={card('#009688')}>
          <h3>Principal</h3>
          <p>{data.principal}</p>
        </div>

        <div style={card('#FF9800')}>
          <h3>Interest</h3>
          <p>{data.interest}</p>
        </div>

        {/* ROW 2 (FULL WIDTH) */}
        <div style={{
          ...card((data.incoming - data.outgoing) >= 0 ? '#3F51B5' : '#F44336'),
          gridColumn: 'span 4'   // 🔥 FULL WIDTH
        }}>
          <h3>Total</h3>
          <p>{data.incoming - data.outgoing}</p>
        </div>

      </div>

      {/* TRANSACTIONS */}
      <TransactionList refresh={reload} />

    </div>
  );
}

export default Dashboard;