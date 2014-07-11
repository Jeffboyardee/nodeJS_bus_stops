var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var xmlparser = require('express-xml-bodyparser');

// var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(xmlparser());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
app.get('/', function(req, res) {res.render('index')});

app.get('/searching', function(req, res){
  // input value from search
  var val = req.query.search;

  if (isNaN(val)){
    res.send("Please enter a valid bus number.");
  } else {
    var url = "http://api.metro.net/agencies/lametro/routes/"+val+"/sequence/";

    // console.log(url);
    requests(url, function(data){
      res.send(data);
    });
  }
});

app.post('/receive-xml', function(req, res, next) {

  // req.body contains the parsed xml
  console.log(req.body);

});



function requests(url, callback) {
  // request module is used to process the yql url and return the results in JSON format
  request(url, function(err, resp, body) {
    var resultsArray = [];
    body = JSON.parse(body);

    // logic used to compare search results with the input from user
    if (!body.items) {
      console.log("nothing found");
      results = "No results found. Try again.";
      callback(results);
    } else {
      // console.log(body.items[0]);
      results = body.items;

      for (var i=0;i<results.length;i++) {
        resultsArray.push(
          {id:results[i]['id'], stop:results[i]['display_name']}
        );
      }
      console.log(resultsArray);
    }
    // pass back the results to client side
    callback(resultsArray);
  });
}


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
