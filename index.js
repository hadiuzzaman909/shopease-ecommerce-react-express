const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, Transaction } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const paymentCollection = client.db('bike_bones').collection('payment');

    const userCollection = client.db('bike_bones').collection('users');

    //parts
    app.get('/parts', async (req, res) => {
      const query = {};
      const cursor = partsCollection.find(query);
      const parts = (await cursor.toArray()).reverse();
      res.send(parts);
    });
    app.get('/purchaseForAll', async (req, res) => {
      const query = {};
      const cursor = purchaseCollection.find(query);
      const parts = (await cursor.toArray()).reverse();
      res.send(parts);
    });
    app.get('/part/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partsCollection.findOne(query);
      res.send(part);
    });

    app.post('/parts',async(req,res)=>{
      const addPart=req.body;
      const result=await partsCollection.insertOne(addPart);
      res.send(result);
    })

    app.delete('/parts/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:ObjectId(id)};
      const result=await partsCollection.deleteOne(query);
      res.send(result);
    })

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
    app.get('/purchaseTt/:id',verifyJWT,async (req,res)=>{
      const id=req.params.id;
      const query={_id: ObjectId(id)};
      const result=await purchaseCollection.findOne(query);

      res.send(result);

    })
    app.patch('/purchase/:id',verifyJWT,async(req,res)=>{
      const id=req.params.id;
      const payment=req.body;
      const filter={_id: ObjectId(id)};
      const updatedDoc={
        $set: {
          paid:true,
          transactionId: payment.transactionId
        }
      }
      const result= await paymentCollection.insertOne(payment);
      const updatedPurchase=await purchaseCollection.updateOne(filter,updatedDoc);
      res.send(updatedDoc);
    })
    //delete
    app.delete('/purchase/:id',async (req,res)=>{
      const id=req.params.id;
      const query={_id: ObjectId(id)};
      const result=await purchaseCollection.deleteOne(query);
      console.log(result)
      res.send(result);
    })
    app.delete('/purchaseForAll/:id',async (req,res)=>{
      const id=req.params.id;
      const query={_id: ObjectId(id)};
      const result=await purchaseCollection.deleteOne(query);
      console.log(result)
      res.send(result);
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
      const reviews = (await cursor.toArray()).reverse();
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

    app.get('/user',verifyJWT,async(req,res)=>{
      const users=await userCollection.find().toArray();
      res.send(users);
    })


    //admin
    app.put('/user/admin/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester=req.decoded.email;
      const requesterAccount=await userCollection.findOne({email: requester});
      if(requesterAccount.role==='admin'){
        const filter = { email: email };
        const updateDoc = {
          $set: {role:'admin'},
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        console.log(result);
        res.send(result);
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }
    })

    app.get('/admin/:email',verifyJWT,async(req,res)=>{
      const email=req.params.email;
      const user=await userCollection.findOne({email:email});
      const isAdmin=user.role==='admin';
      res.send({admin: isAdmin});
    })


    //payment
    app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
      const service = req.body;
      const price = service.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
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