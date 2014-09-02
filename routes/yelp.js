var express = require('express');
var router = express.Router();
var request = require('request');
var yelp = require("yelp").createClient({
	consumer_key: "jWuWFjOYdfoh2D2BK4iT4A",
	consumer_secret: "DdWcUuIakWpOJse-a3XT464XMMI",
	token: "ZNiL2oC7zF-vaquHoK9ZmvzckJjMR17V",
	token_secret: "uxdX7FrRpnWjsGfTmirelXfO8IE"
});
var xml2js = require('xml2js');
var parser = new xml2js.Parser().parseString;
var inspect = require('eyes').inspector({maxLength: false});
var yelpPT = '';
yelpPT = new PublicTransit_yelp();

// route middleware that will happen on every request
router.use(function(req, res, next) {
  // cookies test
  inspect(req.cookies);

  if (req.mySession.seenyou) {
    console.log('Been here, done that.');
    inspect("This is the agencyCookie->"+req.mySession.agencyCookie);
    inspect("This is the agencyCookieName->"+req.mySession.agencyCookieName);
    inspect("This is the routeCookie->"+req.mySession.routeCookie);
    inspect("This is the routeCookieName->"+req.mySession.routeCookieName);
    inspect("This is the directionCookie->"+req.mySession.directionCookie);
    inspect("This is the directionCookieName->"+req.mySession.directionCookieName);
    inspect("This is the stopCookie->"+req.mySession.stopCookie);
    inspect("This is the stopCookieName->"+req.mySession.stopCookieName);
  } else {
    // setting a property will automatically cause a Set-Cookie response to be sent
    req.mySession.seenyou=true;
    console.log('First time visiting');
  }

  // log each request to the console
  console.log(req.method, req.url);
  // continue doing what we were doing and go to the route
  next(); 
});

router.get('/',  function(req, res){
  tempAgency=req.mySession.agencyCookieName;
  tempRoute=req.mySession.routeCookieName;

	res.render('yelp', { title: '[Mobile]Yelp lookup', agency: tempAgency, route: tempRoute });
});

// See http://www.yelp.com/developers/documentation/v2/business
// yelp.business("yelp-san-francisco", function(error, data) {
//   console.log(error);
//   inspect(data);
// });

router.get('/searchingYelp', function(req, res){
  // input value from search
  var val = req.query.search;
  yelpPT.returnStopCall(res, val, 0);
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/yelpSearch-mobile', function(req, res) {      
  var tempAgency='', 
      tempRoute='',
      tempDirection='',
      tempStop=''; 

  if (req.mySession.seenyou) {
    tempAgency=req.mySession.agencyCookie;
    tempRoute=req.mySession.routeCookie;
    tempDirection=req.mySession.directionCookie;
    tempStop=req.mySession.stopCookie;

    yelpPT = null;
    yelpPT = new PublicTransit_yelp();
    yelpPT.agencyRequestMobile(yelpPT.agencyListUrl, req, function(data) {
      yelpPT.routeRequestMobile(yelpPT.routeListUrl+tempAgency, req, function(data) {
        yelpPT.directionsRequestMobile(yelpPT.directionListUrl+tempAgency+"&r="+tempRoute, tempDirection, req, function(data) {          
          yelpPT.stopsRequestMobile(yelpPT.directionListUrl+tempAgency+"&r="+tempRoute, tempDirection, req, function(data) {
            yelpPT.predictionsRequest(yelpPT.stopListUrl+tempAgency+"&r="+tempRoute+"&s="+tempStop+"&useShortTitles=true", function(data) {
              // inspect(yelpPT.myAggregateData);
              res.send(yelpPT.myAggregateData);
            });
          }); // END requesting stops
        }); // END requesting directions
      }); // END requesting route
    }); // END requesting agency
  } else {
    yelpPT.agencyRequestMobile(yelpPT.agencyListUrl, req, function(data) {
      yelpPT.routeRequestMobile(yelpPT.routeListUrl+yelpPT.myAgencies[0].myTags, req, function(data) {
        yelpPT.directionsStopsRequestMobile(yelpPT.directionListUrl+yelpPT.myAgencies[0].myTags+"&r="+yelpPT.myRouts[0].myTags, req, function(data) {
          yelpPT.predictionsRequest(yelpPT.stopListUrl+yelpPT.myAgencies[0].myTags+"&r="+yelpPT.myRouts[0].myTags+"&s="+yelpPT.myStops[0].myTags+"&useShortTitles=true", function(data) {
            res.send(yelpPT.myAggregateData);
          });
        }); // END requesting direction
      }); // END requesting route
    }); // END requesting agency
    req.mySession.seenyou = true;    
  }
});


/** 
 * PublicTransit class Constructor
**/
function PublicTransit_yelp() {
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
  this.myPredictionsSec = [],
  this.yelpAndtransit=[];
  console.log("Constructors set");
}

PublicTransit_yelp.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
}

PublicTransit_yelp.prototype.returnStopCall = function (res, val, tmpCounter) {
  var size = PublicTransit_yelp.size(this.myStops);
  inspect("this is the size of myStops array: "+size);

  if (!size) {
    console.log("myStops variables not defined");
    return;
  }

  if (tmpCounter === size) {
    inspect("blah!!!");  
    inspect(this.yelpAndtransit);
    res.send(this.yelpAndtransit);
    return 1;
  }

  var stopItems = this.myStops[tmpCounter];
  var latAndlon = stopItems.lat+","+stopItems.lon;

  this.yelpRequest(val, latAndlon, stopItems, function(data) {
    inspect("callback received"); 
    inspect("inside counter-> "+tmpCounter);
    
    yelpPT.returnStopCall(res, val, tmpCounter+1);
  }); 
}

/**
 * @public
 * @description: Calls the yelp middleware. It gets the json data from the specified url location
 * @param searchParam: The search text fom the user
**/
PublicTransit_yelp.prototype.yelpRequest = function (searchParam, latAndlon, stopItems, callback) {
  var yr = this;
  var val = searchParam;
    
    yelp.search({term: val, ll: latAndlon, limit: "3"}, function(error, data) {
      // console.log(error);   
      
      inspect("started pushing to yelpAndtransit");
      data.businesses.forEach(function(busi_items){
        yr.yelpAndtransit.push({
          "business_name":busi_items.name,
          "mobile_url":busi_items.mobile_url,
          "display_address":busi_items.location.display_address,
          "stop_name":stopItems.myStopsNames
        });      
      });
      
      inspect("finished pushing to yelpAndtransit");
      console.log(data);
      callback();
    });
}

/**
 * @public
 * @description: Calls the request middleware. It gets the xml data from the specified url location
 * @param url: The url of the api location
**/
PublicTransit_yelp.prototype.dataRequests = function (url, callback) {
  request(url, function (err, resp, body) {
    callback(body);
  });
}

/**
 * @public
 * @description: Requests list of agencies from nextBus
 * @param url: The url of the api that provides a list of agencies available
 * @param agencyID: The agency id (oyelpPTional) taken from the url
**/
PublicTransit_yelp.prototype.agencyRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser(data, function(err, result) {
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
 * @param routeID: The route id (oyelpPTional) taken from the url
**/
PublicTransit_yelp.prototype.routeRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser(data, function(err, result) {
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
 * @param directionID: The directions id (oyelpPTional) taken from the url
 * @param stopID: The stop id (oyelpPTional) taken from the url
**/
PublicTransit_yelp.prototype.directionsRequestMobile = function (url, direction, req, callback) {
  var that = this;

    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser(data, function(err, result) {
        that.myDirectionsRaw = result;
        var initialTag=0;

        that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
          if (req.mySession.directionCookie) {
            if (item.$.tag == req.mySession.directionCookie) {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag, 
                lat: item.$.lat,
                lon: item.$.lon,
                selected : 'yes'
              });
              req.mySession.directionCookie=item.$.tag;
            } else {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                lat: item.$.lat,
                lon: item.$.lon,
                myTags : item.$.tag                  
              });
            }
          } else {
            if (item.$.tag == direction) {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag, 
                lat: item.$.lat,
                lon: item.$.lon,
                selected : 'yes'
              });
              req.mySession.directionCookie=item.$.tag;
            } else {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                lat: item.$.lat,
                lon: item.$.lon,
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
 * @param directionID: The directions id (oyelpPTional) taken from the url
 * @param stopID: The stop id (oyelpPTional) taken from the url
**/
PublicTransit_yelp.prototype.stopsRequestMobile = function (url, direction, req, callback) {
  var that = this;

    this.dataRequests(url, function(data) {
      // converts xml to json and store in result 
      parser(data, function(err, result) {
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
                            lat: itemStop.$.lat,
                            lon: itemStop.$.lon,                             
                            selected : 'yes'
                          });
                          req.mySession.stopCookie=item.$.tag;
                        } else {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            lat: itemStop.$.lat,
                            lon: itemStop.$.lon,                             
                            myTags : item.$.tag
                          });
                        }
                      } else {
                        if (initialTag == 0) {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            myTags : item.$.tag, 
                            lat: itemStop.$.lat,
                            lon: itemStop.$.lon,                             
                            selected : 'yes'
                          });
                          req.mySession.stopCookie=item.$.tag;
                        } else {
                          that.myStops.push({
                            myStopsNames : itemStop.$.title, 
                            lat: itemStop.$.lat,
                            lon: itemStop.$.lon,                             
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
 * @param directionID: The directions id (oyelpPTional) taken from the url
 * @param stopID: The stop id (oyelpPTional) taken from the url
**/
PublicTransit_yelp.prototype.directionsStopsRequestMobile = function (url, req, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser(data, function(err, result) {
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
              lat: item.$.lat,
              lon: item.$.lon,               
              selected : 'yes'
            });
            req.mySession.directionCookie=item.$.tag;
            selectedDirection=item.$.tag;
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              lat: item.$.lat,
              lon: item.$.lon,               
              myTags : item.$.tag                  
            });
          }
        } else {
          if (initialTag==0) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag, 
              lat: item.$.lat,
              lon: item.$.lon,               
              selected : 'yes'
            });
            req.mySession.directionCookie=item.$.tag;
            selectedDirection=item.$.tag;
          } else {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              lat: item.$.lat,
              lon: item.$.lon,               
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
                      lat: itemStop.$.lat,
                      lon: itemStop.$.lon,                       
                      selected : 'yes'
                    });
                    req.mySession.stopCookie=item.$.tag;
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      lat: itemStop.$.lat,
                      lon: itemStop.$.lon,                         
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
                      lat: itemStop.$.lat,
                      lon: itemStop.$.lon,                          
                      selected : 'yes'
                    });
                    req.mySession.stopCookie=item.$.tag;
                  } else {
                    that.myStops.push({
                      myStopsNames : itemStop.$.title, 
                      lat: itemStop.$.lat,
                      lon: itemStop.$.lon,                         
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
PublicTransit_yelp.prototype.predictionsRequest = function (url, callback) {
  var that = this;

  this.dataRequests(url, function(data) {
    // converts xml to json and store in result 
    parser(data, function(err, result) {
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