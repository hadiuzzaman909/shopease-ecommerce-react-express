const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qx6zk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {

    await client.connect();
    const partsCollection = client.db('bike_bones').collection('parts');
    const purchaseCollection = client.db('bike_bones').collection('purchase');
    const reviewsCollection = client.db('bike_bones').collection('reviews');

    const userCollection = client.db('bike_bones').collection('users');

    //parts
    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = partsCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });
    app.get('/part/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partsCollection.findOne(query);
      res.send(part);
    });

    //purchase
    app.post('/purchase',async(req,res)=>{
      const purchase=req.body;
      const result=await purchaseCollection.insertOne(purchase);
      res.send(result);

    })
    app.get('/purchase',async(req,res)=>{
      const email=req.query.email;
      console.log(email);
      const query={email: email}
      const order=await purchaseCollection.find(query).toArray();
      res.send(order);
    })

    //reviews
    app.post('/reviews',async(req,res)=>{
      const reviews=req.body;
      const result=await reviewsCollection.insertOne(reviews);
      res.send(result);
    })
    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });





  }
  finally {


  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello From Bike Bones')
})

app.listen(port, () => {
  console.log(`Bike Bones app listening on port ${port}`)
})