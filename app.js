//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

var app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//express-session code
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
//passport initialization
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
//account user schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//add plugin to schema
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('user', userSchema);

//passport-local-mongoose configuration
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get('/', function(req, res) {
  res.render("home");
})

app.get('/login', function(req, res) {
  res.render("login");
})

app.get('/register', function(req, res) {
  res.render("register");
})

app.get('/secrets', function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
})

app.get('/logout', function(req, res){
  req.logout(); //check passport docs.
  res.redirect('/');
})

app.post('/register', function(req, res) {
  //creating new user and saving to mongo done by passport-Local-Mongoose

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register')
    } else {
      passport.authenticate('local')(req, res, function() {
        res.redirect('/secrets');
      });
    }
  });
});

app.post('/login', function(req, res) {
  user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
      return next(err);
    } else {
      passport.authenticate('local')(req, res, function(){
        res.redirect('/secrets');
      })

    }

  });

});


app.listen(3000, function(req, res) {
  console.log("Server started on port 3000.");
})
