var express = require('express');
var path = require('path');
var logger = require('morgan');


var cookieParser = require('cookie-parser');
// var cookieSession = require('cookie-session');
// var session = require('express-session');
var session = require("client-sessions");

var bodyParser = require('body-parser');
var routes_desktop = require('./routes/desktop');
var routes_mobile = require('./routes/mobile');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Using middleware by using use()
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser("public_transportation"));
// app.use(cookieSession( {name: "mySession", secret: "superjeff", cookies: {maxAge: 10000}} ));
// app.use(session( {secret: "superjeff", cookie: {maxAge: 1000}} ));

app.use(session({
  cookieName: 'mySession', // cookie name dictates the key name added to the request object
  secret: 'blargadeeblargblarg', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));



app.use(express.static(path.join(__dirname, 'public')));
app.use('/desktop', routes_desktop);
app.use('/mobile', routes_mobile);

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
