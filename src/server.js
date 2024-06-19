import express from "express";
import {
  cartItems as cartItemsRaw,
  products as productsRaw,
} from "./temp-data";

// so we can modify the external data
let cartItems = cartItemsRaw;
let products = productsRaw;

const app = express();
app.use(express.json());

function populateCartIds(ids) {
  return ids.map((id) => products.find((product) => product.id === id));
}

app.get("/products", (req, res) => {
  res.json(products);
});

app.get("/cart", (req, res) => {
  const populatedCartItems = populateCartIds(cartItems);
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
