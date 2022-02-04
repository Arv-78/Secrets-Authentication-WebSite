//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate'); // for findOrCreate function in Oauth Strategy
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
  password: String,
  googleId: String
});

//add plugin to schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('user', userSchema);

//passport-local-mongoose configuration
passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//won't work 'cause it's for local Strategy (passport-local-mongoose)
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//use google Oauth20 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', function(req, res) {
  res.render("home");
})

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

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
