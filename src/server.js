import express from "express";
import { MongoClient } from "mongodb";

async function start() {
  const url = `mongodb+srv://techbolaf:bi23VitzFnwdJVDi@cluster0.yn3tllk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
  const client = new MongoClient(url);

  await client.connect();
  const db = client.db("fsv-db");

  const app = express();
  app.use(express.json());

  async function populateCartIds(ids) {
    return Promise.all(
      ids.map((id) => db.collection("products").findOne({ id }))
    );
  }

  app.get("/products", async (req, res) => {
    const products = await db.collection("products").find({}).toArray();
    res.json(products);
  });

  app.get("/users/:userId/cart", async (req, res) => {
    const user = await db
      .collection("users")
      .findOne({ id: req.params.userId });
    const populatedCartItems = await populateCartIds(user.cartItems);
    res.json(populatedCartItems);
  });

  app.get("/products/:productId", async (req, res) => {
    const productId = req.params.productId;
    const product = await db.collection("products").findOne({ id: productId });
    res.json(product);
  });

  app.post("/users/:userId/cart", async (req, res) => {
    const productId = req.body.id;
    const userId = req.params.userId;

    if (!productId) {
      return res
        .status(400)
        .json({ error: "Missing product id in request body" });
    }

    await db.collection("users").updateOne(
      { id: userId },
      {
        $addToSet: { cartItems: productId },
      }
    );

    const user = await db.collection("users").findOne({ id: userId });

    const populatedCartItems = await populateCartIds(user.cartItems);
    res.json(populatedCartItems);
  });

  app.delete("/users/:userId/cart/:productId", async (req, res) => {
    const productId = req.params.productId;
    const userId = req.params.userId;

    if (!productId) {
      return res
        .status(400)
        .json({ error: "Missing product id in request body" });
    }

    await db.collection("users").updateOne(
      { id: userId },
      {
        $pull: { cartItems: productId },
      }
    );

    const user = await db.collection("users").findOne({ id: userId });

    const populatedCartItems = await populateCartIds(user.cartItems);
    res.json(populatedCartItems);
  });

  app.listen(8000, () => {
    console.log("Server is listening on port 8000");
  });
}

start();
