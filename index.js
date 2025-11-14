const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// -------------------- MONGODB CONNECTION --------------------
const uri = "mongodb+srv://fineasedbUser:nOC5Qz8xIk0t0eoO@my-first-cluster1.c0ymrhl.mongodb.net/?appName=MY-First-Cluster1";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Smart server is running');
});

async function run() {
  try {
    await client.connect();

    const db = client.db('smart_db');
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('users');
    const reportsCollection = db.collection('reports');

    // -------------------- USER API --------------------
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const existingUser = await usersCollection.findOne({ email: newUser.email });
      if (existingUser) return res.send({ message: 'User already exists' });

      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // -------------------- GET TRANSACTIONS (Filter + Sort) --------------------
app.get('/transactions', async (req, res) => {
  const email = req.query.email;
  const category = req.query.category;
  const type = req.query.type;  
  const sortBy = req.query.sort;

  const query = {};
  if (email) query.email = email;
  if (category) query.category = category;
  if (type) query.type = type; // 🔥 add this

  let sortOption = { date: -1 };
  if (sortBy === "amount") sortOption = { amount: -1 };

  const result = await transactionsCollection
    .find(query)
    .sort(sortOption)
    .toArray();

  res.send(result);
});



    // -------------------- GET ONE TRANSACTION --------------------
    app.get('/transactions/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionsCollection.findOne(query);
      res.send(result);
    });

    // -------------------- ADD TRANSACTION --------------------
    app.post('/transactions', async (req, res) => {
      const data = req.body;

      if (!data.email || !data.amount || !data.category || !data.type) {
        return res.status(400).send({ message: "Missing fields!" });
      }

      // ensure amount is number
      data.amount = Number(data.amount);
      data.createdAt = new Date();

      const result = await transactionsCollection.insertOne(data);
      res.send(result);
    });

    // -------------------- UPDATE TRANSACTION --------------------
    app.patch('/transactions/:id', async (req, res) => {
      const id = req.params.id;
      const updated = req.body;

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          type: updated.type,
          category: updated.category,
          amount: Number(updated.amount),
          description: updated.description,
          date: updated.date,
        }
      };

      const result = await transactionsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // -------------------- DELETE TRANSACTION --------------------
    app.delete('/transactions/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await transactionsCollection.deleteOne(query);
      res.send(result);
    });

    // -------------------- USER-SPECIFIC BALANCE --------------------
    app.get('/transaction-balance', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email required" });

      try {
        const result = await transactionsCollection
          .find({ email })
          .toArray();

        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Server error", error: err });
      }
    });

    // -------------------- REPORTS --------------------
    app.get('/reports', async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) query.email = email;

      const result = await reportsCollection.find(query).toArray();
      res.send(result);
    });

    console.log("Connected to MongoDB successfully!");
  } 
  finally {}
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Smart server is running on port: ${port}`);
});
