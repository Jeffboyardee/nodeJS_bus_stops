var express = require('express');
var router = express.Router();
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var inspect = require('eyes').inspector({maxLength: false});
var pt = new PublicTransit();

// route middleware that will happen on every request
router.use(function(req, res, next) {

  // log each request to the console
  console.log(req.method, req.url);

  // continue doing what we were doing and go to the route
  next(); 
});

router.get('/',  function(req, res){
  res.render('desktop', { title: 'Express-Realtime Bus/Metro lookup' });
});

router.get('/agencies/:agencyID/:routeID/:directionID/:stopID',  function(req, res){
  res.render('desktop-search', { title: '[Search]Express-Realtime Bus/Metro lookup' });
});

/* GET home page with dynamic url */
router.post('/agencies/:agencyID/:routeID/:directionID/:stopID', function(req, res) {  
  pt.agencyRequest(pt.agencyListUrl, req.params.agencyID, function(data) {
    pt.routeRequest(pt.routeListUrl+req.params.agencyID, req.params.routeID, function(data) {
      pt.directionsStopsRequest(pt.directionListUrl+req.params.agencyID+"&r="+req.params.routeID, req.params.directionID, req.params.stopID, function(data) {
        pt.predictionsRequest(pt.stopListUrl+req.params.agencyID+"&r="+req.params.routeID+"&s="+req.params.stopID+"&useShortTitles=true", function(data) {
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
  pt.agencyRequest(pt.agencyListUrl, function(data) {
    pt.routeRequest(pt.routeListUrl+pt.myAgencies[0].myTags, function(data) {
      pt.directionsStopsRequest(pt.directionListUrl+pt.myAgencies[0].myTags+"&r="+pt.myRouts[0].myTags, function(data) {
        res.send( {agencyName: pt.myAggregateData[0].myAgencies[0].myTags,
                  routeName: pt.myAggregateData[1].myRouts[0].myTags,
                  directionName: pt.myAggregateData[2].myDirections[0].myTags,
                  stopsName: pt.myAggregateData[3].myStops[0].myTags} );
        pt = null; // clear instance of PublicTransit()
        pt = new PublicTransit(); // create new instance of PublicTransit()
      }); // END requesting direction
    }); // END requesting route
  }); // END requesting agency
});

/** Perform searches depending on dropdown selected **/
router.get('/agencySearchRoute', function(req, res) {
  var agency_val = req.query.agency;  
  pt.myAgencies.push( {myTags : agency_val} );
  pt.myAggregateData.push({myAgencies:pt.myAgencies});

  pt.routeRequest(pt.routeListUrl+agency_val, function(data) {
    pt.directionsStopsRequest(pt.directionListUrl+agency_val+"&r="+pt.myRouts[0].myTags, function(data) {
      pt.predictionsRequest(pt.stopListUrl+agency_val+"&r="+pt.myRouts[0].myTags+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
          res.send( {agencyName: agency_val,
                    routeName: pt.myAggregateData[1].myRouts[0].myTags,
                    directionName: pt.myAggregateData[2].myDirections[0].myTags,
                    stopsName: pt.myAggregateData[3].myStops[0].myTags} );
          pt = null; // clear instance of PublicTransit()
          pt = new PublicTransit(); // create new instance of PublicTransit()
      }); // END requesting prediction times
    }); // END requesting direction and stops
  });  // END requesting route
});

router.get('/routeSearchDirection', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route;
  pt.myAgencies.push( {myTags : agency_val} );
  pt.myRouts.push( {myTags : route_val} );
  pt.myAggregateData.push({myAgencies: pt.myAgencies});
  pt.myAggregateData.push({myRouts: pt.myRouts});
  // inspect(pt.myAggregateData);

  pt.directionsStopsRequest(pt.directionListUrl+agency_val+"&r="+route_val, function(data) {
    pt.predictionsRequest(pt.stopListUrl+agency_val+"&r="+route_val+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
      res.send( {agencyName: agency_val,
                routeName: route_val,
                directionName: pt.myAggregateData[2].myDirections[0].myTags,
                stopsName: pt.myAggregateData[3].myStops[0].myTags} );
      pt = null; // clear instance of PublicTransit()
      pt = new PublicTransit(); // create new instance of PublicTransit()
    }); // END requesting prediction times
  }); // END requesting direction and stops
});

router.get('/directionSearchStop', function(req, res) {
  var agency_val = req.query.agency,
      route_val = req.query.route,
      direction_val = req.query.direction; 
  pt.myAgencies.push( {myTags : agency_val} );  
  pt.myRouts.push( {myTags : route_val} );
  pt.myDirections.push( {myTags : direction_val} );
  pt.myAggregateData.push({myAgencies: pt.myAgencies});
  pt.myAggregateData.push({myRouts: pt.myRouts});
  pt.myAggregateData.push({myDirections: pt.myDirections});

  pt.directionsStopsRequest(pt.directionListUrl+agency_val+"&r="+route_val, direction_val, function(data) {
    pt.predictionsRequest(pt.stopListUrl+agency_val+"&r="+route_val+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
      res.send( {agencyName: agency_val,
                routeName: route_val,
                directionName: direction_val,
                stopsName: pt.myAggregateData[3].myStops[0].myTags} );
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

      pt.predictionsRequest(pt.stopListUrl+agency_val+"&r="+route_val+"&s="+stop_val+"&useShortTitles=true", function(data) {
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
  this.agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList";
  this.routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=";
  this.directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=";
  this.stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";
  this.myAggregateData = [],
  this.myAgenciesRaw = [],
  this.myAgencies = [],
  this.myAgenciesNames = [],
  this.myRoutsRaw = [],
  this.myRouts = [],
  this.myRoutsNames = [],
  this.myDirectionsRaw = [],
  this.myDirections = [],
  this.myDirectionsNames = [],
  this.myStopsRaw = [],
  this.myStops = [],
  this.myStopsNames = [],
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
          myTags : that.myAgenciesRaw.body.agency[0].$.tag
        });
        that.myAggregateData.push({myAgencies:that.myAgencies});
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
              myTags : item.$.tag, selected : 'yes'
            });
          } else {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myTags : item.$.tag
            });
          }
        });
        that.myAggregateData.push({myAgencies:that.myAgencies});
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
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myRoutsRaw = result;
          that.myRouts.push({
            myRoutsNames : that.myRoutsRaw.body.route[0].$.title, 
            myTags : that.myRoutsRaw.body.route[0].$.tag
          });
        that.myAggregateData.push({myRouts:that.myRouts});
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
              myRoutsNames : item.$.title, myTags : item.$.tag, selected : 'yes'
            });
          } else {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag
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
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
          that.myDirections.push({
            myDirectionsNames : that.myDirectionsRaw.body.route[0].direction[0].$.title, 
            myTags : that.myDirectionsRaw.body.route[0].direction[0].$.tag
          });
        that.myAggregateData.push({myDirections:that.myDirections});
                      
        that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) {
          if (itemStop.$.tag == that.myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag) {
            that.myStops.push({
              myStopsNames : itemStop.$.title, 
              myTags : that.myDirectionsRaw.body.route[0].direction[0].stop[0].$.tag
            });
          }
        });
        
        that.myAggregateData.push({myStops:that.myStops});
        callback();
      });
    }); 
  } else if (argumentsMain == 3) {
    callback = stopID;
    this.dataRequests(url, function(data) {
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
                      myTags : item.$.tag
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
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
        that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
          if (directionID == item.$.tag) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag, 
              selected : 'yes'
            });
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag                  
            });
          }
        });
        that.myAggregateData.push({myDirections:that.myDirections});

        that.myDirectionsRaw.body.route[0].direction.forEach(function(itemDirection) {  // loop through each direction
          if (directionID == itemDirection.$.tag) { // finding the correct direction
            itemDirection.stop.forEach(function(item) {  // loop through each stop of the selected direction
              that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) { // loop through all the stops available within this route
                if (item.$.tag == itemStop.$.tag) {
                  if (item.$.tag == stopID) {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag, 
                      selected : 'yes'
                    });
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag
                    });
                  }
                }                    
              });
            });
          }
        });

        that.myAggregateData.push({myStops:that.myStops});
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
  that.myPredictions=[];

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
