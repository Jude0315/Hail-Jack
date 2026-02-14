const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PlayerModel = require('./models/Player');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Local MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/players")
  .then(() => console.log("MongoDB connected locally ✅"))
  .catch((err) => console.log("MongoDB connection failed ❌", err));

 app.post("/login", (req, res) => {
    const {email, password} = req.body;
    PlayerModel.findOne({email: email})
    .then(user => {
        if(user) {
            if(user.password === password) {
                res.json("Success")
            } else {
                res.json("the password is incorrect")
            }
        } else {
            res.json("No record existed")
        }
    })
})

 
  app.post('/register', (req, res) => {
    PlayerModel.create(req.body)
    .then(players => res.json(players))
    .catch(err => res.json(err))
})

// Simple test route
/*app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});*/


// Start server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
