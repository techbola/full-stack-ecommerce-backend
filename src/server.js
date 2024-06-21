import express from "express";
import "dotenv/config";
import { MongoClient } from "mongodb";
import path from "path";

async function start() {
  const url = process.env.MONGO_DB_URL;
  const client = new MongoClient(url);

  await client.connect();
  const db = client.db("fsv-db");

  const app = express();
  app.use(express.json());

  app.use("/images", express.static(path.join(__dirname, "../assets")));

  async function populateCartIds(ids) {
    if (!ids) return [];
    return Promise.all(
      ids?.map((id) => db.collection("products").findOne({ id }))
    );
  }

  app.get("/api/products", async (req, res) => {
    const products = await db.collection("products").find({}).toArray();
    res.json(products);
  });

  app.get("/api/users/:userId/cart", async (req, res) => {
    const user = await db
      .collection("users")
      .findOne({ id: req.params.userId });
    const populatedCartItems = await populateCartIds(user?.cartItems);
    res.json(populatedCartItems);
  });

  app.get("/api/products/:productId", async (req, res) => {
    const productId = req.params.productId;
    const product = await db.collection("products").findOne({ id: productId });
    res.json(product);
  });

  app.post("/api/users/:userId/cart", async (req, res) => {
    const productId = req.body.id;
    const userId = req.params.userId;

    if (!productId) {
      return res
        .status(400)
        .json({ error: "Missing product id in request body" });
    }

    const existingUser = await db.collection("users").findOne({ id: userId });

    if (!existingUser) {
      await db.collection("users").insertOne({ id: userId, cartItems: [] });
    }

    await db.collection("users").updateOne(
      { id: userId },
      {
        $addToSet: { cartItems: productId },
      }
    );

    const user = await db.collection("users").findOne({ id: userId });

    const populatedCartItems = await populateCartIds(user?.cartItems);
    res.json(populatedCartItems);
  });

  app.delete("/api/users/:userId/cart/:productId", async (req, res) => {
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

    const populatedCartItems = await populateCartIds(user?.cartItems);
    res.json(populatedCartItems);
  });

  app.listen(8000, () => {
    console.log("Server is listening on port 8000");
  });
}

start();
