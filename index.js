const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qx6zk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}



async function run() {
  try {

    await client.connect();
    const partsCollection = client.db('bike_bones').collection('parts');
    const purchaseCollection = client.db('bike_bones').collection('purchase');
    const reviewsCollection = client.db('bike_bones').collection('reviews');
    const myProfileCollection = client.db('bike_bones').collection('myProfile');

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
    app.get('/purchase',verifyJWT,async(req,res)=>{
      const email=req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query={email: email}
        const order=await purchaseCollection.find(query).toArray();
         return res.send(order);
      }
      else {
        return res.status(403).send({ message: 'forbidden access' });
      }

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

    //myProfile
    app.put('/myProfile', async (req, res) => {
      const email = req.query.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await myProfileCollection.updateOne(filter, updateDoc, options);
      res.send(result);

    })



    //users
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h'})
      res.send({result,token});

    })
    app.put('/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {role:'admin'},
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.get('/user',async(req,res)=>{
      const users=await userCollection.find().toArray();
      res.send(users);
    })
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