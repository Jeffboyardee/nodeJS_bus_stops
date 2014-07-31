var express = require('express');
var router = express.Router();
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var inspect = require('eyes').inspector({maxLength: false});
var agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList";
var routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=";
var directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=";
var stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";

// route middleware that will happen on every request
router.use(function(req, res, next) {

  // log each request to the console
  console.log(req.method, req.url);

  // continue doing what we were doing and go to the route
  next(); 
});

router.get('/',  function(req, res){
  res.render('index', { title: 'Express-Realtime Bus/Metro lookup' });
});

router.get('/agencies/:agencyID/:routeID/:directionID/:stopID',  function(req, res){
  res.render('search', { title: '[Search]Express-Realtime Bus/Metro lookup' });
});

/* GET home page with different uri possibility. */
router.post('/agencies/:agencyID/:routeID/:directionID/:stopID', function(req, res) {  
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
        if (req.params.agencyID == item.$.tag) {
          myAgencies.push({
            myAgenciesNames : item.$.title, myAgenciesTags : item.$.tag, selected : 'yes'
          });
        } else {
          myAgencies.push({
            myAgenciesNames : item.$.title, myAgenciesTags : item.$.tag
          });
        }
      });      

      myAggregateData.push({myAgencies:myAgencies});
      // inspect(myAggregateData);
      // <----------START requesting route
      dataRequests(routeListUrl+req.params.agencyID, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;

          myRoutsRaw.body.route.forEach(function(item) {
            if (req.params.routeID == item.$.tag) {
              myRouts.push({
                myRoutsNames : item.$.title, myRoutsTags : item.$.tag, selected : 'yes'
              });
            } else {
              myRouts.push({
                myRoutsNames : item.$.title, myRoutsTags : item.$.tag
              });
            }
          });

          myAggregateData.push({myRouts:myRouts});
          //inspect(myAggregateData);
          // <----------START requesting direction and stops
          dataRequests(directionListUrl+req.params.agencyID+"&r="+req.params.routeID, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              myDirectionsRaw.body.route[0].direction.forEach(function(item) {
                if (req.params.directionID == item.$.tag) {
                  myDirections.push({                  
                    myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag, selected : 'yes'
                  });
                } else {
                  myDirections.push({                  
                    myDirectionsNames : item.$.title, myDirectionsTags : item.$.tag                  
                  });
                }
              });

              myAggregateData.push({myDirections:myDirections});
              //inspect(myDirectionsRaw);
              myDirectionsRaw.body.route[0].direction[0].stop.forEach(function(item) {
                myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == item.$.tag) {
                    if (req.params.stopID == item.$.tag) {
                      myStops.push({
                        myStopsNames : itemStop.$.title, myStopsTags : item.$.tag, selected : 'yes'
                      });
                    } else {
                      myStops.push({
                        myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
                      });
                    }
                  }
                });
              });

              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);
              // <----------START requesting prediction times
              dataRequests(stopListUrl+req.params.agencyID+"&r="+req.params.routeID+"&s="+req.params.stopID+"&useShortTitles=true", function(data) {
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

/* Perform initial search of online data source */
router.get('/agencySearch', function(req, res) {
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
      myAgencies.push({
        myAgenciesNames : myAgenciesRaw.body.agency[0].$.title, 
        myAgenciesTags : myAgenciesRaw.body.agency[0].$.tag
      });
      myAggregateData.push({myAgencies:myAgencies});
      // inspect(myAggregateData);

      // <----------START requesting route
      dataRequests(routeListUrl+myAgencies[0].myAgenciesTags, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;
          
            myRouts.push({
              myRoutsNames : myRoutsRaw.body.route[0].$.title, 
              myRoutsTags : myRoutsRaw.body.route[0].$.tag
            });
          
          myAggregateData.push({myRouts:myRouts});
          // inspect(myAggregateData);

          // <----------START requesting direction and stops
          dataRequests(directionListUrl+myAgencies[0].myAgenciesTags+"&r="+myRouts[0].myRoutsTags, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              
                myDirections.push({
                  myDirectionsNames : myDirectionsRaw.body.route[0].direction[0].$.title, 
                  myDirectionsTags : myDirectionsRaw.body.route[0].direction[0].$.tag
                });
              
              myAggregateData.push({myDirections:myDirections});
              // inspect(myDirectionsRaw);
                            
              myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                if (itemStop.$.tag == myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag) {
                  myStops.push({
                    myStopsNames : itemStop.$.title, 
                    myStopsTags : myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag
                  });
                }
              });
              
              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);

              res.send( {agencyName: myAggregateData[0].myAgencies[0].myAgenciesTags,
                    routeName: myAggregateData[1].myRouts[0].myRoutsTags,
                    directionName: myAggregateData[2].myDirections[0].myDirectionsTags,
                    stopsName: myAggregateData[3].myStops[0].myStopsTags} );
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

/** Perform searches depending on dropdown selected **/
router.get('/agencySearchRoute', function(req, res) {
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
      dataRequests(routeListUrl+val, function(data) {
        // converts xml to json and store in result 
        parser.parseString(data, function(err, result) {
          myRoutsRaw = result;
          
            myRouts.push({
              myRoutsNames : myRoutsRaw.body.route[0].$.title, 
              myRoutsTags : myRoutsRaw.body.route[0].$.tag
            });
          
          // res.send(myRouts);
          myAggregateData.push({myRouts:myRouts});
          // inspect(myAggregateData);

          // <----------START requesting direction and stops
          dataRequests(directionListUrl+val+"&r="+myRouts[0].myRoutsTags, function(data) {
            // converts xml to json and store in result 
            parser.parseString(data, function(err, result) {
              myDirectionsRaw = result;
              
                myDirections.push({
                  myDirectionsNames : myDirectionsRaw.body.route[0].direction[0].$.title, 
                  myDirectionsTags : myDirectionsRaw.body.route[0].direction[0].$.tag
                });
              
              myAggregateData.push({myDirections:myDirections});
              // inspect(myDirectionsRaw);
              
                myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag) {
                    myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myStopsTags : myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag
                    });
                  }
                });
              
              myAggregateData.push({myStops:myStops});
              // inspect(myAggregateData);

              // <----------START requesting prediction times
              dataRequests(stopListUrl+val+"&r="+myRouts[0].myRoutsTags+"&s="+myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
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

                  // inspect(myAggregateData);
                  res.send( {agencyName: val,
                    routeName: myAggregateData[1].myRouts[0].myRoutsTags,
                    directionName: myAggregateData[2].myDirections[0].myDirectionsTags,
                    stopsName: myAggregateData[3].myStops[0].myStopsTags} );
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
router.get('/routeSearchDirection', function(req, res) {
  var agency_val = req.query.agency;
  var route_val = req.query.route;
  var myAggregateData = [];
  var myAgencies = [];
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

    
  myAgencies.push( {myAgenciesTags : agency_val} );
  myAggregateData.push({myAgencies:myAgencies});

  myRouts.push( {myRoutsTags : route_val} );
  myAggregateData.push({myRouts:myRouts});
  // inspect(myAggregateData);

  // <----------START requesting direction and stops
  dataRequests(directionListUrl+agency_val+"&r="+route_val, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myDirectionsRaw = result;
      
        myDirections.push({
          myDirectionsNames : myDirectionsRaw.body.route[0].direction[0].$.title, 
          myDirectionsTags : myDirectionsRaw.body.route[0].direction[0].$.tag
        });
      
      myAggregateData.push({myDirections:myDirections});
      // inspect(myDirectionsRaw);
            
        myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
          if (itemStop.$.tag == myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag) {
            myStops.push({
              myStopsNames : itemStop.$.title, 
              myStopsTags : myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag
            });
          }
        });
      
      myAggregateData.push({myStops:myStops});
      // inspect(myAggregateData);

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
          // inspect(myAggregateData);

          res.send( {agencyName: agency_val,
                    routeName: route_val,
                    directionName: myAggregateData[2].myDirections[0].myDirectionsTags,
                    stopsName: myAggregateData[3].myStops[0].myStopsTags} );
        });
      });        
      // END requesting prediction times
    });
  });        
  // END requesting direction
});
router.get('/directionSearchStop', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction;
  var myAggregateData = [];
  var myAgencies = [];
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
  
  myAgencies.push( {myAgenciesTags : agency_val} );
  myAggregateData.push({myAgencies:myAgencies});

  myRouts.push( {myRoutsTags : route_val} );
  myAggregateData.push({myRouts:myRouts});

  myDirections.push( {myDirectionsTags : direction_val} );
  myAggregateData.push({myDirections:myDirections});

  // <----------START requesting direction and stops
   dataRequests(directionListUrl+agency_val+"&r="+route_val, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      myDirectionsRaw = result;
     
      myDirectionsRaw.body.route[0].direction.forEach(function(item) {
        console.log('item.$.tag: '+item.$.tag+'\n'+'direction_val: '+direction_val);
        if (item.$.tag == direction_val) {
          item.stop.forEach(function(item) {
            
              myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                if (itemStop.$.tag == item.$.tag) {
                  myStops.push({
                    myStopsNames : itemStop.$.title, myStopsTags : item.$.tag
                  });
                }
              });
            
          });
        }
      });
      myAggregateData.push({myStops:myStops});
      inspect(myStops);
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
          // res.send(myAggregateData);
          // inspect(myAggregateData);
          res.send( {agencyName: agency_val,
                    routeName: route_val,
                    directionName: direction_val,
                    stopsName: myAggregateData[3].myStops[0].myStopsTags} );
        });
      });        
      // END requesting prediction times
    });
  });        
  // END requesting direction and stops
});
router.get('/stopSearchPrediction', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction,
      stop_val = req.query.stop;
  var myAggregateData = [];
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
router.get('/searching', function(req, res){
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



module.exports = router;
