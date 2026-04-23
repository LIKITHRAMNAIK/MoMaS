const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

// 🔥 Replace with your MongoDB URL
mongoose.connect('YOUR_MONGO_URL')
  .then(() => console.log('DB Connected'))
  .catch(err => console.log(err));

async function cleanNames() {
  const txs = await Transaction.find();

  for (let tx of txs) {
    let cleanName = tx.person_name
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    tx.person_name = cleanName;
    await tx.save();
  }

  console.log("✅ Names cleaned");
  process.exit(); // 🔥 exit after run
}

cleanNames();