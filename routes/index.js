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
var pt = new PublicTransit();

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

/* GET home page with dynamic url */
router.post('/agencies/:agencyID/:routeID/:directionID/:stopID', function(req, res) {  
  pt.agencyRequest(agencyListUrl, req.params.agencyID, function(data) {
    pt.routeRequest(routeListUrl+req.params.agencyID, req.params.routeID, function(data) {
      pt.directionsStopsRequest(directionListUrl+req.params.agencyID+"&r="+req.params.routeID, req.params.directionID, req.params.stopID, function(data) {
        pt.predictionsRequest(stopListUrl+req.params.agencyID+"&r="+req.params.routeID+"&s="+req.params.stopID+"&useShortTitles=true", function(data) {
            res.send(pt.myAggregateData);
            pt = null; // clear instance of PublicTransit()
            pt = new PublicTransit(); // create new instance of PublicTransit()
        }); // END requesting prediction times
      }); // END requesting direction
    }); // END requesting route
  }); // END requesting agency
});

/* GET home page and redirect to dynamic url */
router.get('/agencySearch', function(req, res) {  
  pt.agencyRequest(agencyListUrl, function(data) {
    pt.routeRequest(routeListUrl+pt.myAgencies[0].myAgenciesTags, function(data) {
      pt.directionsStopsRequest(directionListUrl+pt.myAgencies[0].myAgenciesTags+"&r="+pt.myRouts[0].myRoutsTags, function(data) {
        res.send( {agencyName: pt.myAggregateData[0].myAgencies[0].myAgenciesTags,
                  routeName: pt.myAggregateData[1].myRouts[0].myRoutsTags,
                  directionName: pt.myAggregateData[2].myDirections[0].myDirectionsTags,
                  stopsName: pt.myAggregateData[3].myStops[0].myStopsTags} );
        pt = null; // clear instance of PublicTransit()
        pt = new PublicTransit(); // create new instance of PublicTransit()
      }); // END requesting direction
    }); // END requesting route
  }); // END requesting agency
});

/** Perform searches depending on dropdown selected **/
router.get('/agencySearchRoute', function(req, res) {
  var agency_val = req.query.agency;  
  pt.myAgencies.push( {myAgenciesTags : agency_val} );
  pt.myAggregateData.push({myAgencies:pt.myAgencies});

  pt.routeRequest(routeListUrl+agency_val, function(data) {
    pt.directionsStopsRequest(directionListUrl+agency_val+"&r="+pt.myRouts[0].myRoutsTags, function(data) {
      pt.predictionsRequest(stopListUrl+agency_val+"&r="+pt.myRouts[0].myRoutsTags+"&s="+pt.myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
          res.send( {agencyName: agency_val,
                    routeName: pt.myAggregateData[1].myRouts[0].myRoutsTags,
                    directionName: pt.myAggregateData[2].myDirections[0].myDirectionsTags,
                    stopsName: pt.myAggregateData[3].myStops[0].myStopsTags} );
          pt = null; // clear instance of PublicTransit()
          pt = new PublicTransit(); // create new instance of PublicTransit()
      }); // END requesting prediction times
    }); // END requesting direction and stops
  });  // END requesting route
});

router.get('/routeSearchDirection', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route;
  pt.myAgencies.push( {myAgenciesTags : agency_val} );
  pt.myRouts.push( {myRoutsTags : route_val} );
  pt.myAggregateData.push({myAgencies: pt.myAgencies});
  pt.myAggregateData.push({myRouts: pt.myRouts});
  // inspect(pt.myAggregateData);

  pt.directionsStopsRequest(directionListUrl+agency_val+"&r="+route_val, function(data) {
    pt.predictionsRequest(stopListUrl+agency_val+"&r="+route_val+"&s="+pt.myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
      res.send( {agencyName: agency_val,
                routeName: route_val,
                directionName: pt.myAggregateData[2].myDirections[0].myDirectionsTags,
                stopsName: pt.myAggregateData[3].myStops[0].myStopsTags} );
      pt = null; // clear instance of PublicTransit()
      pt = new PublicTransit(); // create new instance of PublicTransit()
    }); // END requesting prediction times
  }); // END requesting direction and stops
});

router.get('/directionSearchStop', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction; 
  pt.myAgencies.push( {myAgenciesTags : agency_val} );  
  pt.myRouts.push( {myRoutsTags : route_val} );
  pt.myDirections.push( {myDirectionsTags : direction_val} );
  pt.myAggregateData.push({myAgencies: pt.myAgencies});
  pt.myAggregateData.push({myRouts: pt.myRouts});
  pt.myAggregateData.push({myDirections: pt.myDirections});

  pt.directionsStopsRequest(directionListUrl+agency_val+"&r="+route_val, direction_val, function(data) {
    pt.predictionsRequest(stopListUrl+agency_val+"&r="+route_val+"&s="+pt.myStops[0].myStopsTags+"&useShortTitles=true", function(data) {
      res.send( {agencyName: agency_val,
                routeName: route_val,
                directionName: direction_val,
                stopsName: pt.myAggregateData[3].myStops[0].myStopsTags} );
      pt = null; // clear instance of PublicTransit()
      pt = new PublicTransit(); // create new instance of PublicTransit()
    });  // END requesting prediction times
  });  // END requesting direction and stops
});

router.get('/stopSearchPrediction', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction,
      stop_val = req.query.stop;   

      pt.predictionsRequest(stopListUrl+agency_val+"&r="+route_val+"&s="+stop_val+"&useShortTitles=true", function(data) {
        res.send( {agencyName: agency_val,
                routeName: route_val,
                directionName: direction_val,
                stopsName: stop_val} );
        pt = null; // clear instance of PublicTransit()
        pt = new PublicTransit(); // create new instance of PublicTransit()
      }); // END requesting prediction times
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

/** 
 * PublicTransit class Constructor
**/
function PublicTransit() {
  this.myAggregateData = [],
  this.myAgenciesRaw = [],
  this.myAgencies = [],
  this.myAgenciesNames = [],
  this.myAgenciesTags = [],
  this.myRoutsRaw = [],
  this.myRouts = [],
  this.myRoutsNames = [],
  this.myRoutsTags = [],
  this.myDirectionsRaw = [],
  this.myDirections = [],
  this.myDirectionsNames = [],
  this.myDirectionsTags = [],
  this.myStopsRaw = [],
  this.myStops = [],
  this.myStopsNames = [],
  this.myStopsTags = [],
  this.myPredictionsRaw = [],
  this.myPredictions = [],
  this.myPredictionsMin = [],
  this.myPredictionsSec = [];
  console.log("Constructors set");
}

/**
 * @public
 * @description: Requests list of agencies from nextBus
 * @param url: The url of the api that provides a list of agencies available
 * @param agencyID: The agency id (optional) taken from the url
**/
PublicTransit.prototype.agencyRequest = function (url, agencyID, callback) {
  var that = this;
  var argumentsMain = arguments.length;
  
  if (argumentsMain == 2) {
    callback = agencyID;
    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myAgenciesRaw = result;      
        that.myAgencies.push({
          myAgenciesNames : that.myAgenciesRaw.body.agency[0].$.title, 
          myAgenciesTags : that.myAgenciesRaw.body.agency[0].$.tag
        });
        that.myAggregateData.push({myAgencies:that.myAgencies});
        // inspect(that.myAggregateData);
        callback();
      });
    });  
  } else {
    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myAgenciesRaw = result;      
        that.myAgenciesRaw.body.agency.forEach(function(item) {
          if (agencyID == item.$.tag) {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myAgenciesTags : item.$.tag, selected : 'yes'
            });
          } else {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myAgenciesTags : item.$.tag
            });
          }
        });
        that.myAggregateData.push({myAgencies:that.myAgencies});
        // inspect(that.myAgencies);
        callback();
      });
    });
  }
}

/**
 * @public
 * @description: Requests list of routes from nextBus
 * @param url: The url of the api that provides a list of routes available
 * @param routeID: The route id (optional) taken from the url
**/
PublicTransit.prototype.routeRequest = function (url, routeID, callback) {
  var that = this;
  var argumentsMain = arguments.length;

  if (argumentsMain == 2) {
    callback = routeID;
    this.dataRequests(url, function(data) {
      console.log("inside routeRequest/dataRequests");
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myRoutsRaw = result;
        
          that.myRouts.push({
            myRoutsNames : that.myRoutsRaw.body.route[0].$.title, 
            myRoutsTags : that.myRoutsRaw.body.route[0].$.tag
          });
        
        that.myAggregateData.push({myRouts:that.myRouts});
        // inspect(that.myAggregateData);
        callback();
      });
    });  
  } else {
    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myRoutsRaw = result;

        that.myRoutsRaw.body.route.forEach(function(item) {
          if (routeID == item.$.tag) {
            that.myRouts.push({
              myRoutsNames : item.$.title, myRoutsTags : item.$.tag, selected : 'yes'
            });
          } else {
            that.myRouts.push({
              myRoutsNames : item.$.title, myRoutsTags : item.$.tag
            });
          }
        });
        that.myAggregateData.push({myRouts:that.myRouts});   
        callback();     
      });
    });
  }
}

/**
 * @public
 * @description: Requests list of Directions and Stops from nextBus
 * @param url: The url of the api that provides a list of directions and stops available
 * @param directionID: The directions id (optional) taken from the url
 * @param stopID: The stop id (optional) taken from the url
**/
PublicTransit.prototype.directionsStopsRequest = function (url, directionID, stopID, callback) {
  var that = this;
  var argumentsMain = arguments.length;

  if (argumentsMain == 2) {
    callback = directionID;
    this.dataRequests(url, function(data) {
      // console.log("inside directionsStopsRequest/dataRequests");
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
        // inspect(that.myDirectionsRaw);
          that.myDirections.push({
            myDirectionsNames : that.myDirectionsRaw.body.route[0].direction[0].$.title, 
            myDirectionsTags : that.myDirectionsRaw.body.route[0].direction[0].$.tag
          });
        
        that.myAggregateData.push({myDirections:that.myDirections});
        // inspect(that.myDirectionsRaw);
                      
        that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
          if (itemStop.$.tag == that.myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag) {
            that.myStops.push({
              myStopsNames : itemStop.$.title, 
              myStopsTags : that.myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag
            });
          }
        });
        
        that.myAggregateData.push({myStops:that.myStops});
        // inspect(that.myAggregateData);
        callback();
      });
    }); 
  } else if (argumentsMain == 3) {
    callback = stopID;
    this.dataRequests(url, function(data) {
      // console.log("inside directionsStopsRequest/dataRequests");
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        
        that.myDirectionsRaw = result;


        that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
          if (item.$.tag == directionID) {
            item.stop.forEach(function(item) {
                that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
                  if (itemStop.$.tag == item.$.tag) {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myStopsTags : item.$.tag
                    });
                  }
                });
            });
          }
        });
        that.myAggregateData.push({myStops: that.myStops});
        callback();


      });
    }); 
  } else {
    this.dataRequests(url, function(data) {
      // console.log("inside directionsStopsRequest/dataRequests");
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
        that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
          if (directionID == item.$.tag) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myDirectionsTags : item.$.tag, selected : 'yes'
            });
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myDirectionsTags : item.$.tag                  
            });
          }
        });
        that.myAggregateData.push({myDirections:that.myDirections});
        // inspect(myAggregateData);

        that.myDirectionsRaw.body.route[0].direction.forEach(function(itemDirection) {  // loop through each direction
          if (directionID == itemDirection.$.tag) { // finding the correct direction
            itemDirection.stop.forEach(function(item) {  // loop through each stop of the selected direction
              // inspect(item);
              that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) { // loop through all the stops available within this route
                // inspect(itemStop.$.title);
                if (item.$.tag == itemStop.$.tag) {
                  if (item.$.tag == stopID) {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myStopsTags : item.$.tag, selected : 'yes'
                    });
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myStopsTags : item.$.tag
                    });
                  }
                }                    
              });
            });
          }
        });

        that.myAggregateData.push({myStops:that.myStops});
        // inspect(myAggregateData);
        callback();
      });
    });
  }
}

/**
 * @public
 * @description: Requests list of predictions from nextBus
 * @param url: The url of the api that provides a list of predictions available
**/
PublicTransit.prototype.predictionsRequest = function (url, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      that.myPredictionsRaw = result;
      var predictionsCheck = that.myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions;
      if (predictionsCheck) {
        that.myPredictions.push({myPredictions:that.myPredictionsRaw.body.predictions[0].$.dirTitleBecauseNoPredictions});
        that.myAggregateData.push({myPredictions:that.myPredictions});   
      } else {
        that.myPredictionsRaw.body.predictions[0].direction[0].prediction.forEach(function(item) {
          that.myPredictions.push({
            myPredictionsMin : item.$.minutes, 
            myPredictionsSec : item.$.seconds
          });
        });                    
        that.myAggregateData.push({myPredictions:that.myPredictions});                    
      }
      // inspect(myAggregateData);
      callback();
    });
  });
}

/**
 * @public
 * @description: Calls the request middleware. It gets the xml data from the specified url location
 * @param url: The url of the api location
**/
PublicTransit.prototype.dataRequests = function (url, callback) {
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
      // console.log(resultsArray);
    }
    // pass back the results to client side
    callback(resultsArray);
  });
}



module.exports = router;
