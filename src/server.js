import express from "express";
import { MongoClient } from "mongodb";

import {
  cartItems as cartItemsRaw,
  products as productsRaw,
} from "./temp-data";

// so we can modify the external data
let cartItems = cartItemsRaw;
let products = productsRaw;

const url = `mongodb+srv://techbolaf:bi23VitzFnwdJVDi@cluster0.yn3tllk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(url);

const app = express();
app.use(express.json());

async function populateCartIds(ids) {
  await client.connect();
  const db = client.db("fsv-db");
  return Promise.all(
    ids.map((id) => db.collection("products").findOne({ id }))
  );
}

app.get("/products", async (req, res) => {
  await client.connect();
  const db = client.db("fsv-db");
  const products = await db.collection("products").find({}).toArray();
  res.json(products);
});

app.get("/users/:userId/cart", async (req, res) => {
  await client.connect();
  const db = client.db("fsv-db");
  const user = await db.collection("users").findOne({ id: req.params.userId });
  const populatedCartItems = await populateCartIds(user.cartItems);
  res.json(populatedCartItems);
});

app.get("/products/:productId", (req, res) => {
  const productId = req.params.productId;
  const product = products.find((product) => product.id === productId);
  res.json(product);
});

app.post("/cart", (req, res) => {
  const productId = req.body.id;
  if (!productId) {
    return res
      .status(400)
      .json({ error: "Missing product id in request body" });
  }
  cartItems.push(productId);
  const populatedCartItems = populateCartIds(cartItems);
  res.json(populatedCartItems);
});

app.delete("/cart/:productId", (req, res) => {
  const productId = req.params.productId;
  cartItems = cartItems.filter((id) => id !== productId);
  const populatedCartItems = populateCartIds(cartItems);
  res.json(populatedCartItems);
});

app.listen(8000, () => {
  console.log("Server is listening on port 8000");
});
