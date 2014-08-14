var express = require('express');
var router = express.Router();
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var inspect = require('eyes').inspector({maxLength: false});
var pt = '';
pt = new PublicTransit();

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
  res.render('mobile', { title: '[Mobile]Express-Realtime Bus/Metro lookup' });
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearch-mobile', function(req, res) {      
  var tempAgency='', 
      tempRoute='',
      tempDirection='',
      tempStop=''; 

  if (req.mySession.seenyou) {
    tempAgency=req.mySession.agencyCookie;
    tempRoute=req.mySession.routeCookie;
    tempDirection=req.mySession.directionCookie;
    tempStop=req.mySession.stopCookie;

    pt = null;
    pt = new PublicTransit();
    pt.agencyRequestMobile(pt.agencyListUrl, req, function(data) {
      pt.routeRequestMobile(pt.routeListUrl+tempAgency, req, function(data) {
        pt.directionsRequestMobile(pt.directionListUrl+tempAgency+"&r="+tempRoute, tempDirection, req, function(data) {          
          pt.stopsRequestMobile(pt.directionListUrl+tempAgency+"&r="+tempRoute, tempDirection, req, function(data) {
            pt.predictionsRequest(pt.stopListUrl+tempAgency+"&r="+tempRoute+"&s="+tempStop+"&useShortTitles=true", function(data) {
              // inspect(pt.myAggregateData);
              res.send(pt.myAggregateData);
            });
          }); // END requesting stops
        }); // END requesting directions
      }); // END requesting route
    }); // END requesting agency
  } else {
    pt.agencyRequestMobile(pt.agencyListUrl, req, function(data) {
      pt.routeRequestMobile(pt.routeListUrl+pt.myAgencies[0].myTags, req, function(data) {
        pt.directionsStopsRequestMobile(pt.directionListUrl+pt.myAgencies[0].myTags+"&r="+pt.myRouts[0].myTags, req, function(data) {
          pt.predictionsRequest(pt.stopListUrl+pt.myAgencies[0].myTags+"&r="+pt.myRouts[0].myTags+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
            res.send(pt.myAggregateData);
          });
        }); // END requesting direction
      }); // END requesting route
    }); // END requesting agency
    req.mySession.seenyou = true;    
  }
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearchMobile-change-agency', function(req, res) {  
    var agency = req.body.agency;
    // console.log("agency change: "+agency);    
    req.mySession.agencyCookie=agency;
    req.mySession.routeCookie=null;
    req.mySession.directionCookie=null;
    req.mySession.stopCookie=null;

    pt = null;
    pt = new PublicTransit();
    pt.routeRequestMobile(pt.routeListUrl+agency, req, function(data) {
      pt.directionsStopsRequestMobile(pt.directionListUrl+agency+"&r="+pt.myRouts[0].myTags, req, function(data) {  
          pt.predictionsRequest(pt.stopListUrl+agency+"&r="+pt.myRouts[0].myTags+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
            // inspect("This is what myAggregateData looks like after agency change by user->");
            // inspect(pt.myAggregateData);
            res.send(pt.myAggregateData);
          });
      }); // END requesting direction and stops
    }); // END requesting route
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearchMobile-change-route', function(req, res) {  
    var agency = req.body.agency;
    var route = req.body.route;
    // console.log("route change: "+route);
    req.mySession.agencyCookie=agency;
    req.mySession.routeCookie=route;
    req.mySession.directionCookie=null;
    req.mySession.stopCookie=null;

    pt = null;
    pt = new PublicTransit();
    pt.directionsStopsRequestMobile(pt.directionListUrl+agency+"&r="+route, req, function(data) {
      pt.predictionsRequest(pt.stopListUrl+agency+"&r="+route+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
        // inspect("This is what myAggregateData looks like after route change by user->");
        // inspect(pt.myAggregateData);
        res.send(pt.myAggregateData);
      });
    }); // END requesting direction
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearchMobile-change-direction', function(req, res) {  
    var agency = req.body.agency;
    var route = req.body.route;
    var direction = req.body.direction;
    // console.log("route direction: "+direction);
    req.mySession.agencyCookie=agency;
    req.mySession.routeCookie=route;
    req.mySession.directionCookie=direction;
    req.mySession.stopCookie=null;

    pt = null;
    pt = new PublicTransit();
    pt.stopsRequestMobile(pt.directionListUrl+agency+"&r="+route, direction, req, function(data) {
      pt.predictionsRequest(pt.stopListUrl+agency+"&r="+route+"&s="+pt.myStops[0].myTags+"&useShortTitles=true", function(data) {
        // inspect("This is what myAggregateData looks like after direction change by user->");
        // inspect(pt.myAggregateData);
        res.send(pt.myAggregateData);
      });
    }); // END requesting direction
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearchMobile-change-stop', function(req, res) {  
    var agency = req.body.agency;
    var route = req.body.route;
    var direction = req.body.direction;
    var stop = req.body.stop;
    // console.log("change stop: "+stop);
    req.mySession.agencyCookie=agency;
    req.mySession.routeCookie=route;
    req.mySession.directionCookie=direction;
    req.mySession.stopCookie=stop;

    pt = null;
    pt = new PublicTransit();
    pt.predictionsRequest(pt.stopListUrl+agency+"&r="+route+"&s="+stop+"&useShortTitles=true", function(data) {
      // inspect("This is what myAggregateData looks like after stop change by user->");
      // inspect(pt.myAggregateData);
      res.send(pt.myAggregateData);
    });
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
 * @description: Calls the request middleware. It gets the xml data from the specified url location
 * @param url: The url of the api location
**/
PublicTransit.prototype.dataRequests = function (url, callback) {
  request(url, function (err, resp, body) {
    callback(body);
  });
}

/**
 * @public
 * @description: Requests list of agencies from nextBus
 * @param url: The url of the api that provides a list of agencies available
 * @param agencyID: The agency id (optional) taken from the url
**/
PublicTransit.prototype.agencyRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      that.myAgenciesRaw = result;      
      var initialTag = 0;
      that.myAgenciesRaw.body.agency.forEach(function(item) {
        if (req.mySession.agencyCookie) {
          if (req.mySession.agencyCookie==item.$.tag) {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myTags : item.$.tag, selected : 'yes'
            });
            req.mySession.agencyCookie=item.$.tag;
          } else {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myTags : item.$.tag
            });
          }
        } else {
          if (initialTag==0) {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myTags : item.$.tag, selected : 'yes'
            });
            req.mySession.agencyCookie=item.$.tag;
          } else {
            that.myAgencies.push({
              myAgenciesNames : item.$.title, 
              myTags : item.$.tag
            });
          }
          initialTag++;
        }
        
        

      });
      that.myAggregateData.push({myAgencies:that.myAgencies});
      // inspect(that.myAgencies);
      callback();
    });
  });
}

/**
 * @public
 * @description: Requests list of routes from nextBus
 * @param url: The url of the api that provides a list of routes available
 * @param routeID: The route id (optional) taken from the url
**/
PublicTransit.prototype.routeRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      that.myRoutsRaw = result;
      var initialTag = 0;
      that.myRoutsRaw.body.route.forEach(function(item) {
        if (req.mySession.routeCookie) {
          if (req.mySession.routeCookie == item.$.tag) {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag, selected : 'yes'
            });
            req.mySession.routeCookie=item.$.tag;
          } else {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag
            });
          }
        } else {
          if (initialTag==0) {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag, selected : 'yes'
            });
            req.mySession.routeCookie=item.$.tag;
          } else {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag
            });
          }
          initialTag++;  
        }
        
      });
      that.myAggregateData.push({myRouts:that.myRouts});   
      // inspect(that.myRouts);
      callback();     
    });
  }); 
}

/**
 * @public
 * @description: Requests list of Directions and Stops from nextBus
 * @param url: The url of the api that provides a list of directions and stops available
 * @param directionID: The directions id (optional) taken from the url
 * @param stopID: The stop id (optional) taken from the url
**/
PublicTransit.prototype.directionsRequestMobile = function (url, direction, req, callback) {
  var that = this;

    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
        var initialTag=0;

        that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
          if (req.mySession.directionCookie) {
            if (item.$.tag == req.mySession.directionCookie) {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag, 
                selected : 'yes'
              });
              req.mySession.directionCookie=item.$.tag;
            } else {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag                  
              });
            }
          } else {
            if (item.$.tag == direction) {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag, 
                selected : 'yes'
              });
              req.mySession.directionCookie=item.$.tag;
            } else {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag                  
              });
            }
            initialTag++;  
          }
          
        });
        that.myAggregateData.push({myDirections:that.myDirections});
        // inspect(that.myDirections);
        callback();
      });
    });  
}

/**
 * @public
 * @description: Requests list of Directions and Stops from nextBus, and stores list of
 * stops in an array called myStops.
 * @param url: The url of the api that provides a list of directions and stops available
 * @param directionID: The directions id (optional) taken from the url
 * @param stopID: The stop id (optional) taken from the url
**/
PublicTransit.prototype.stopsRequestMobile = function (url, direction, req, callback) {
  var that = this;

    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser.parseString(data, function(err, result) {
        that.myDirectionsRaw = result;
        var initialTag=0;
        var selectedDirection='';

        that.myDirectionsRaw.body.route[0].direction.forEach(function(itemDirection) {  // loop through each direction
            if (itemDirection.$.tag == direction) { // finding the correct direction
              itemDirection.stop.forEach(function(item) {  // loop through each stop of the selected direction       
                that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) { // loop through all the stops available within this route
                  

                  
                    if (itemStop.$.tag == item.$.tag) {
                      if (req.mySession.stopCookie) {
                        if (req.mySession.stopCookie==item.$.tag) {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            myTags : item.$.tag, 
                            selected : 'yes'
                          });
                          req.mySession.stopCookie=item.$.tag;
                        } else {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            myTags : item.$.tag
                          });
                        }
                      } else {
                        if (initialTag == 0) {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            myTags : item.$.tag, 
                            selected : 'yes'
                          });
                          req.mySession.stopCookie=item.$.tag;
                        } else {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            myTags : item.$.tag
                          });
                        }
                        initialTag++;  
                      }
                      



                    }  
                  
                  


                });
              });
            }  

        });

        that.myAggregateData.push({myStops:that.myStops});
        // inspect(that.myStops);
        callback();
      });
    }); 
}

/**
 * @public
 * @description: Requests list of Directions and Stops from nextBus, and stores list of
 * directions in an array called myDirections
 * @param url: The url of the api that provides a list of directions and stops available
 * @param directionID: The directions id (optional) taken from the url
 * @param stopID: The stop id (optional) taken from the url
**/
PublicTransit.prototype.directionsStopsRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser.parseString(data, function(err, result) {
      that.myDirectionsRaw = result;
      var initialTag=0;
      var selectedDirection='';

      that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
        if (req.mySession.directionCookie) {
          inspect("req.mySession.directionCookie is present: "+req.mySession.directionCookie)
          if (req.mySession.directionCookie == item.$.tag) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag, 
              selected : 'yes'
            });
            req.mySession.directionCookie=item.$.tag;
            selectedDirection=item.$.tag;
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag                  
            });
          }
        } else {
          if (initialTag==0) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag, 
              selected : 'yes'
            });
            req.mySession.directionCookie=item.$.tag;
            selectedDirection=item.$.tag;
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag                  
            });
          }
          initialTag++;  
        }
        inspect("selectedDirection: "+selectedDirection);
      });
      that.myAggregateData.push({myDirections:that.myDirections});

      that.myDirectionsRaw.body.route[0].direction.forEach(function(itemDirection) {  // loop through each direction        
        if (itemDirection.$.tag == selectedDirection) { // finding the correct direction
          initialTag = 0;
          itemDirection.stop.forEach(function(item) {  // loop through each stop of the selected direction       
            that.myDirectionsRaw.body.route[0].stop.forEach(function(itemStop) { // loop through all the stops available within this route
              if (req.mySession.stopCookie) {
                if (req.mySession.stopCookie == item.$.tag) {
                  if (initialTag == 0) {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag, 
                      selected : 'yes'
                    });
                    req.mySession.stopCookie=item.$.tag;
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag
                    });
                  }
                }
              } else {
                if (itemStop.$.tag == item.$.tag) {
                  if (initialTag == 0) {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag, 
                      selected : 'yes'
                    });
                    req.mySession.stopCookie=item.$.tag;
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      myTags : item.$.tag
                    });
                  }
                  initialTag++;
                }  
              }
              

            });
          });
        }
      });

      that.myAggregateData.push({myStops:that.myStops});
      // inspect(that.myStops);
      callback();
    });
  });
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
      // inspect(that.myPredictions);
      callback();
    });
  });
}



module.exports = router;
