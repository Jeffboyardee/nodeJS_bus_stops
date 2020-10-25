var express = require('express');
var router = express.Router();
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var inspect = require('eyes').inspector({maxLength: false});

// route middleware that will happen on every request
router.use(function(req, res, next) {
  // cookies test
  inspect(req.cookies);

  if (req.mySession.seenyou) {
    console.log('Been here, done that.');
    inspect("This is in the cookie->"+req.mySession.agencyCookie);
    inspect("This is in the cookie->"+req.mySession.routeCookie);
    inspect("This is in the cookie->"+req.mySession.directionCookie);
    inspect("This is in the cookie->"+req.mySession.stopCookie);
  } else {
    // setting a property will automatically cause a Set-Cookie response to be sent
    console.log('First time visiting');
  }

  // log each request to the console
  console.log(req.method, req.url);
  // continue doing what we were doing and go to the route
  next(); 
});

router.get('/',  function(req, res){
  res.render('index', { title: 'Public Transit Schedule' });
});






module.exports = router;
