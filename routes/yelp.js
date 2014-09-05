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
var PublicTransit_yelp = require('./publictransit');
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

  // Make a call to the recursive function
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
// function PublicTransit_yelp() {
//   this.yelpAndtransit=[];
//   console.log("PublicTransit_yelp Constructors set");
// }
// PublicTransit_yelp.prototype.yelpAndtransit=[];

/**
 * @public
 * @description: Returns the size/length of an object like myStops
 * @param obj: The object in question.
**/
PublicTransit_yelp.prototype.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
}

/**
 * @public
 * @description: A recursive function that calls yelpRequest for each item in the myStops object.
 * It will send to the client side the resulting object yelpAndtransit.
 * @param res: response object of express.js needed here to send the obj back to the client side.
 * @param val: The search value from the user/client side.
 * @param tmpCounter: Passing this counter to be used in the recursion. Counter starts at location
 * of first item in myStops object which is 0.
**/
PublicTransit_yelp.prototype.returnStopCall = function (res, val, tmpCounter) {
  var stopItems, latAndlon, stopItemsName = '';
  var size = this.size(this.myStops);  
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

  stopItems = this.myStops[tmpCounter];
  latAndlon = stopItems.lat+","+stopItems.lon;
  stopItemsName = stopItems.myStopsNames;

  this.yelpRequest(val, latAndlon, stopItemsName, function(data) {
    inspect("callback received"); 
    inspect("inside counter-> "+tmpCounter);
    
    yelpPT.returnStopCall(res, val, tmpCounter+1);
  }); 
}

/**
 * @public
 * @description: Calls the yelp middleware. It gets the json data from the specified url location
 * @param val: The search text from the user
 * @param latAndlon: Lattitude and Longitude of each stop from myStops
 * @param stopItemsName: The name of the stop being searched
**/
PublicTransit_yelp.prototype.yelpRequest = function (val, latAndlon, stopItemsName, callback) {
  var yr = this;
    
    yelp.search({term: val, ll: latAndlon, limit: "2"}, function(error, data) {
      // console.log(error);   
      
      inspect("started pushing to yelpAndtransit");
      data.businesses.forEach(function(busi_items){
        yr.yelpAndtransit.push({
          "business_name":busi_items.name,
          "mobile_url":busi_items.mobile_url,
          "display_address":busi_items.location.display_address,
          "stop_name":stopItemsName
        });      
      });
      
      inspect("finished pushing to yelpAndtransit");
      console.log(data);
      callback();
    });
}

module.exports = router;