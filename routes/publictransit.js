var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser().parseString;
var inspect = require('eyes').inspector({maxLength: false});

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
  this.myPredictionsSec = [],
  this.yelpAndtransit=[],
  inspect("Constructors set");
}

/**
 * @public
 * @description: Not being used now. It is from the craiglist scraper example.
 * @param url: The url of the api location
**/
PublicTransit.prototype.requests = function (url, callback) {
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
            req.mySession.agencyCookieName=item.$.title;
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
            req.mySession.agencyCookieName=item.$.title;
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
            req.mySession.routeCookieName=item.$.title;
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
            req.mySession.routeCookieName=item.$.title;
          } else {
            that.myRouts.push({
              myRoutsNames : item.$.title, myTags : item.$.tag
            });
          }
          initialTag++;  
        }
        
      });
      that.myAggregateData.push({myRouts:that.myRouts});   
      //inspect(that.myRouts);
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
              // req.mySession.directionCookie=item.$.tag;
              // req.mySession.directionCookieName=item.$.title;
            } else {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                lat: item.$.lat,
                lon: item.$.lon,                   
                myTags : item.$.tag                  
              });
            }
          } else {
            // if ((item.$.tag == direction) || (initialTag == 0)) {
              that.myDirections.push({                  
                myDirectionsNames : item.$.title, 
                myTags : item.$.tag,
                lat: item.$.lat,
                lon: item.$.lon,                    
                selected : 'yes'
              });
              req.mySession.directionCookie=item.$.tag;
              req.mySession.directionCookieName=item.$.title;              
            // } else {
            //   that.myDirections.push({                  
            //     myDirectionsNames : item.$.title, 
            //     lat: item.$.lat,
            //     lon: item.$.lon,                   
            //     myTags : item.$.tag                  
            //   });
            // }
            initialTag++;  
          }
          
        });
        that.myAggregateData.push({myDirections:that.myDirections});
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
                          req.mySession.stopCookieName=itemStop.$.title;
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
                            lat: itemStop.$.lat,
                            lon: itemStop.$.lon, 
                            myTags : item.$.tag, 
                            selected : 'yes'
                          });
                          req.mySession.stopCookie=item.$.tag;
                          req.mySession.stopCookieName=itemStop.$.title;
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
    parser(data, function(err, result) {
      that.myDirectionsRaw = result;
      var initialTag=0;
      var selectedDirection='';

      that.myDirectionsRaw.body.route[0].direction.forEach(function(item) {
        if (req.mySession.directionCookie) {
          if (req.mySession.directionCookie == item.$.tag) {
            that.myDirections.push({                  
              myDirectionsNames : item.$.title, 
              myTags : item.$.tag,                
              selected : 'yes'
            });
            req.mySession.directionCookie=item.$.tag;
            req.mySession.directionCookieName=item.$.title;
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
            req.mySession.directionCookieName=item.$.title;
            selectedDirection=item.$.tag;
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
      
      that.myDirectionsRaw.body.route[0].direction.forEach(function(itemDirection) {  // loop through each direction        
        inspect("JEFF my selected direction pt1: ")
        inspect(that.myDirections)  
        if (itemDirection.$.tag == selectedDirection) { // finding the correct direction
          initialTag = 0;
          inspect("JEFF my selected direction pt2: ")
          inspect(itemDirection.$.tag) 
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
                    req.mySession.stopCookieName=itemStop.$.title;
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
                    req.mySession.stopCookieName=itemStop.$.title;
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
PublicTransit.prototype.predictionsRequest = function (url, callback) {
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
      // inspect(that.myAggregateData);
      callback();
    });
  });
}

// Exports the PublicTransit class to be accessible by other files. Ex. At the top of another file,
// the class can be included by doing this: require('./publictransit').
module.exports = PublicTransit;