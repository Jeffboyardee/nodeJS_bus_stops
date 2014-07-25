var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var xmlparser = require('express-xml-bodyparser');
var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var inspect = require('eyes').inspector({maxLength: false});
var agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList",
  routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=",
  directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=",
  stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";

var routes = require('./routes/index');

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
app.use('/', routes);

app.get('/',  function(req, res){
  res.render('index', { title: 'Express-Realtime Bus/Metro lookup' });
});

/* Perform initial search of online data source */
app.get('/agencySearch', function(req, res) {
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    

  // <----------START requesting agency
  dataRequests(agencyListUrl, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myAgenciesRaw = result;      

      myAgenciesRaw.body.agency.forEach(function(item) {
        myAgencies.push({
          myAgenciesNames : item.$.title, myAgenciesTags : item.$.tag
        });
      });      
      // res.send(myAgencies);
      myAggregateData.push({myAgencies:myAgencies});
      // inspect(myAggregateData);

      // <----------START requesting route
      dataRequests(routeListUrl+myAgencies[0].myAgenciesTags, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;

          myRoutsRaw.body.route.forEach(function(item) {
            myRouts.push({
              myRoutsNames : item.$.title, myRoutsTags : item.$.tag
            });
          });
          // res.send(myRouts);
          myAggregateData.push({myRouts:myRouts});
          //inspect(myAggregateData);

          // <----------START requesting direction and stops
          dataRequests(directionListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              
              myDirectionsRaw.body.route[0].direction.forEach(function(item) {
                myDirections.push({
                  myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag
                });
              });
              // res.send(myDirections);
              myAggregateData.push({myDirections:myDirections});
              //inspect(myDirectionsRaw);
              
              myDirectionsRaw.body.route[0].direction[0].stop.forEach(function(item) {
                myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == item.$.tag) {
                    myStops.push({
                      myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
                    });
                  }
                });
              });
              // res.send(myDirections);
              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);



              // <----------START requesting prediction times
              dataRequests(stopListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
                // converts xml to json and store in result 
                parser.parseString(data, function(err, result) {
                  myPredictionsRaw = result;
                  
                  var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

                  if (predictionsCheck) {
                    myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
                  } else {
                    myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
                      myPredictions.push({
                        myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
                      });
                    });                    
                    myAggregateData.push({myPredictions:myPredictions});                    
                  }
                  res.send(myAggregateData);
                  // inspect(myAggregateData);
                });
              });        
              // END requesting prediction times




            });
          });        
          // END requesting direction

        });
      });
      // END requesting route

    });
  });
  // END requesting agency
});

/* GET home page with different uri possibility. */
app.get('/agencies/:agencyID/:routeID/:directionID/:stopID', function(req, res) {  
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    

  // <----------START requesting agency
  dataRequests(agencyListUrl, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myAgenciesRaw = result;      

      myAgenciesRaw.body.agency.forEach(function(item) {
        if (item.$.tag == req.params.agencyID) {
          myAgencies.push({
            myAgenciesNames : item.$.title, myAgenciesTags : item.$.tag
          });
        }
      });

      // res.send(myAgencies);
      myAggregateData.push({myAgencies:myAgencies});
      // inspect(myAggregateData);

      // <----------START requesting route
      dataRequests(routeListUrl+myAggregateData[0].myAgencies[0].myAgenciesTags, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;
//inspect(myRoutsRaw);
          myRoutsRaw.body.route.forEach(function(item) {
            if (item.$.tag == req.params.routeID) {
              myRouts.push({
                myRoutsNames : item.$.title, myRoutsTags : item.$.tag
              });
            }
          });
          // res.send(myRouts);
          myAggregateData.push({myRouts:myRouts});
          // inspect(myAggregateData);

          // <----------START requesting direction and stops
          dataRequests(directionListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              
              myDirectionsRaw.body.route[0].direction.forEach(function(item) {
                if (item.$.tag == req.params.directionID) {
                  myDirections.push({
                    myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag
                  });
                }
              });
              // res.send(myDirections);
              myAggregateData.push({myDirections:myDirections});
              inspect(myDirectionsRaw);
              
              myDirectionsRaw.body.route[0].direction[0].stop.forEach(function(item) {
                myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == item.$.tag) {
                    myStops.push({
                      myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
                    });
                  }
                });
              });
              // res.send(myDirections);
              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);



              // <----------START requesting prediction times
              dataRequests(stopListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
                // converts xml to json and store in result 
                parser.parseString(data, function(err, result) {
                  myPredictionsRaw = result;
                  
                  var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

                  if (predictionsCheck) {
                    myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
                  } else {
                    myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
                      myPredictions.push({
                        myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
                      });
                    });                    
                    myAggregateData.push({myPredictions:myPredictions});                    
                  }
                  res.send(myAggregateData);
                  //inspect(myAggregateData);
                });
              });        
              // END requesting prediction times




            });
          });        
          // END requesting direction

        });
      });
      // END requesting route

    });
  });
  // END requesting agency  
  res.render('index', { title: 'Express-Realtime Bus/Metro lookup' });  
});

app.get('/agencySearchRoute', function(req, res) {
  var val = req.query.agency;
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    


      myAgencies.push( {myAgenciesTags : val} );

      // res.send(myAgencies);
      myAggregateData.push({myAgencies:myAgencies});
      // inspect(myAggregateData);

      // <----------START requesting route
      dataRequests(routeListUrl+myAgencies[0].myAgenciesTags, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;
          //inspect(myRoutsRaw);
          myRoutsRaw.body.route.forEach(function(item) {
            myRouts.push({
              myRoutsNames : item.$.title, myRoutsTags : item.$.tag
            });
          });
          // res.send(myRouts);
          myAggregateData.push({myRouts:myRouts});
          // inspect(myAggregateData);

          // <----------START requesting direction and stops
          dataRequests(directionListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              
              myDirectionsRaw.body.route[0].direction.forEach(function(item) {
                myDirections.push({
                  myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag
                });
              });
              // res.send(myDirections);
              myAggregateData.push({myDirections:myDirections});
              // inspect(myDirectionsRaw);
              
              myDirectionsRaw.body.route[0].direction[0].stop.forEach(function(item) {
                myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == item.$.tag) {
                    myStops.push({
                      myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
                    });
                  }
                });
              });
              // res.send(myDirections);
              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);



              // <----------START requesting prediction times
              dataRequests(stopListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
                // converts xml to json and store in result 
                parser.parseString(data, function(err, result) {
                  myPredictionsRaw = result;
                  
                  var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

                  if (predictionsCheck) {
                    myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
                  } else {
                    myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
                      myPredictions.push({
                        myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
                      });
                    });                    
                    myAggregateData.push({myPredictions:myPredictions});                    
                  }
                  res.send(myAggregateData);
                  //inspect(myAggregateData);
                });
              });        
              // END requesting prediction times


            });
          });        
          // END requesting direction

        });
      });
      // END requesting route
});

app.get('/routeSearchDirection', function(req, res) {
  var agency_val = req.query.agency;
  var route_val = req.query.route;
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    


  myRouts.push( {myAgenciesTags : agency_val, myRoutsTags : route_val} );
  // res.send(myRouts);
  myAggregateData.push({myRouts:myRouts});
  // inspect(myAggregateData);

  // <----------START requesting direction and stops
  dataRequests(directionListUrl+myRouts[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myDirectionsRaw = result;
      
      myDirectionsRaw.body.route[0].direction.forEach(function(item) {
        myDirections.push({
          myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag
        });
      });
      // res.send(myDirections);
      myAggregateData.push({myDirections:myDirections});
      // inspect(myDirectionsRaw);
      
      myDirectionsRaw.body.route[0].direction[0].stop.forEach(function(item) {
        myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
          if (itemStop.$.tag == item.$.tag) {
            myStops.push({
              myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
            });
          }
        });
      });
      // res.send(myDirections);
      myAggregateData.push({myStops:myStops});
      // inspect(myAggregateData);



      // <----------START requesting prediction times
      dataRequests(stopListUrl+myRouts[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myPredictionsRaw = result;
          
          var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

          if (predictionsCheck) {
            myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
          } else {
            myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
              myPredictions.push({
                myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
              });
            });                    
            myAggregateData.push({myPredictions:myPredictions});                    
          }
          res.send(myAggregateData);
          inspect(myAggregateData);
        });
      });        
      // END requesting prediction times


    });
  });        
  // END requesting direction

});

app.get('/directionSearchStop', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction;
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    

  // <----------START requesting direction and stops
  dataRequests(directionListUrl+agency_val+"&r="+route_val, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myDirectionsRaw = result;

      myDirectionsRaw.body.route[0].direction.forEach(function(item) {
        if (item.$.tag == direction_val) {
          // inspect(item);
          
          item.stop.forEach(function(itemInner) {
            // inspect(itemInner);
            myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
              if (itemStop.$.tag == itemInner.$.tag) {
                myStops.push({
                  myStopsNames : itemStop.$.title, myStopsTags : itemStop.$.tag
                });
              }
            });
          });
        }
      });
      // res.send(myDirections);
      myAggregateData.push({myStops:myStops});
      // inspect(myStops);

      // <----------START requesting prediction times
      dataRequests(stopListUrl+agency_val+"&r="+route_val+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myPredictionsRaw = result;
          
          var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

          if (predictionsCheck) {
            myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
          } else {
            myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
              myPredictions.push({
                myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
              });
            });                    
            myAggregateData.push({myPredictions:myPredictions});                    
          }
          res.send(myAggregateData);
          // inspect(myAggregateData);
        });
      });        
      // END requesting prediction times


    });
  });        
  // END requesting direction and stops
});

app.get('/stopSearchPrediction', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction,
      stop_val = req.query.stop;
  var myAggregateData = [];
  var myAgenciesRaw = [],
      myAgencies = [],
      myAgenciesNames = [],
      myAgenciesTags = [];
  var myRoutsRaw = [],
      myRouts = [],
      myRoutsNames = [],
      myRoutsTags = [];
  var myDirectionsRaw = [],
      myDirections = [],
      myDirectionsNames = [],
      myDirectionsTags = [];
  var myStopsRaw = [],
      myStops = [],
      myStopsNames = [],
      myStopsTags = [];
  var myPredictionsRaw = [],
      myPredictions = [],
      myPredictionsMin = [],
      myPredictionsSec = [];    

      // <----------START requesting prediction times
      dataRequests(stopListUrl+agency_val+"&r="+route_val+"&s="+stop_val+"&useShortTitles=true", function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myPredictionsRaw = result;
          
          var predictionsCheck = myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;

          if (predictionsCheck) {
            myAggregateData.push({myPredictions:myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
          } else {
            myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
              myPredictions.push({
                myPredictionsMin : item.$.minutes, myPredictionsSec : item.$.seconds
              });
            });                    
            myAggregateData.push({myPredictions:myPredictions});                    
          }
          res.send(myAggregateData);
          // inspect(myAggregateData);
        });
      });        
      // END requesting prediction times
});

app.get('/searching', function(req, res){
  // input value from search
  var val = req.query.search;

  if (isNaN(val)){
    res.send("Please enter a valid bus number.");
  } else {
    var url = "http://api.metro.net/agencies/lametro/routes/"+val+"/sequence/";
    console.log(url);
    // calls function requests() set in this file
    requests(url, function(data){
      res.send(data);
    });
  }
});

// a call to get xml data from url
function dataRequests(url, callback) {
  request(url, function (err, resp, body) {
    callback(body);
  });
}

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
        resultsArray.push({
          id:results[i]['id'], 
          stop:results[i]['display_name']
        });
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
