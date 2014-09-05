var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require("client-sessions");
var bodyParser = require('body-parser');
var inspect = require('eyes').inspector({maxLength: false});

var routes_main = require('./routes/index');
var routes_desktop = require('./routes/desktop');
var routes_mobile = require('./routes/mobile');
var routes_yelp = require('./routes/yelp');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Using middleware by using use()
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser("public_transportation"));
app.use(session({
  cookieName: 'mySession', // cookie name dictates the key name added to the request object
  secret: 'blargadeeblargblarg', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms (currently 1 whole day)
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes_main);
app.use('/desktop', routes_desktop);
app.use('/mobile', routes_mobile);
app.use('/yelp', routes_yelp);

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


// const DEFAULT_TIMEOUT = 10000;

/**
Throws an error after the specified request timeout elapses.

Options include:
    - timeout
    - errorPrototype (the type of Error to throw)
**/
// module.exports = function(options) {
//     //Set options
//     options = options || {};
//     if(options.timeout == null)
//         options.timeout = DEFAULT_TIMEOUT;
//     return function(req, res, next) {
//         //timeout is the timeout timeout for this request
//         var tid, timeout = options.timeout;
//         //Add setTimeout and clearTimeout functions
//         req.setTimeout = function(newTimeout) {
//             if(newTimeout != null)
//                 timeout = newTimeout; //Reset the timeout for this request
//             req.clearTimeout();
//             tid = setTimeout(function() {
//                 if(options.throwError && !res.finished)
//                 {
//                     //throw the error
//                     var proto = options.error == null ? Error : options.error;
//                     next(new proto("Timeout " + req.method + " " + req.url) );
//                 }
//             }, timeout);
//         };
//         req.clearTimeout = function() {
//             clearTimeout(tid);
//         };
//         req.getTimeout = function() {
//             return timeout;
//         };
//         //proxy end to clear the timeout
//         var oldEnd = res.end;
//         res.end = function() {
//             req.clearTimeout();
//             res.end = oldEnd;
//             return res.end.apply(res, arguments);
//         }
//         //start the timer
//         req.setTimeout();
//         next();
//     };
// }

module.exports = app;
// module.exports.inspect = inspect;