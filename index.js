const express = require("express");
require("./config");
const cors = require("cors");
const User = require("./User");
const Product = require("./Product");
const Jwt = require("jsonwebtoken");
const jwtkey = "iStore";
const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  let data = new User(req.body);
  let result = await data.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtkey, { expiresIn: "5h" }, (err, token) => {
    if (err) {
      res.send("something went wrong");
    }
    res.send({ result, auth: token });
  });
});

app.post("/login", async (req, res) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtkey, { expiresIn: "5h" }, (err, token) => {
        if (err) {
          res.send("something went wrong");
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send("No user found");
    }
  } else {
    res.send("Please enter email and password");
  }
});

app.post("/add-product",verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

app.get("/products", verifyToken,async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No products found" });
  }
});

app.delete("/product/:id", verifyToken,async (req, res) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

app.get("/product/:id",verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send({ result: "No Record found" });
  }
});

app.put("/product/:id",verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

app.get("/search/:key", verifyToken,async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(req,res,next) {
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        Jwt.verify(token,jwtkey,(err,valid) => {
            if(err){
                res.status(401).send({result:'please provide a valid token'});
            }
            else{
                next();
            }
        })
    }else{
        res.send({result:'please add token with header'})
    }
}

app.listen(5000);
