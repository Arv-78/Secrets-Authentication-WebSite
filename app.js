//jshint esversion:6

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

var app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");
//account user schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
//for Encryption
var secret = 'thisisasecretestring.';
//add plugin before model -> model uses userSchema.
userSchema.plugin(encrypt, { secret: secret });

const User = new mongoose.model('user', userSchema);

app.get('/', function(req, res){
  res.render("home");
})

app.get('/login', function(req, res){
  res.render("login");
})

app.get('/register', function(req, res){
  res.render("register");
})

app.post('/register', function(req, res){

  user = new User({
    email: req.body.username,
    password: req.body.password
  });

  user.save(function(err){
    if(err){
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.post('/login', function(req, res){

  User.findOne({email: req.body.username}, function(err, userFound){
    if(err){
      console.log(err);
    } else {
      if(userFound && userFound.password === req.body.password){
        res.render("secrets");
      } else {
        res.send("Wrong Password");
      }
    }
  });
});


app.listen(3000, function(req, res){
  console.log("Server started on port 3000.");
})
