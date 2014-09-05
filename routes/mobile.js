var express = require('express');
var router = express.Router();
var request = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser().parseString;
var inspect = require('eyes').inspector({maxLength: false});
var PublicTransit = require('./publictransit');

var pt = '';
pt = new PublicTransit();

// route middleware that will happen on every request
router.use(function(req, res, next) {
  // cookies test
  inspect(req.cookies);

  if (req.mySession.seenyou && req.mySession.agencyCookie) {
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
    console.log('First time visiting');
  }

  // log each request to the console
  console.log(req.method, req.url);
  // continue doing what we were doing and go to the route
  next(); 
});

router.get('/',  function(req, res){
  res.render('mobile', { title: '[Mobile]Express-Realtime Bus/Metro lookup'});
});

/* POST home page and redirect to dynamic url for mobile */
router.post('/agencySearch-mobile', function(req, res) {      
  var tempAgency='', 
      tempRoute='',
      tempDirection='',
      tempStop=''; 

  if (req.mySession.seenyou && req.mySession.agencyCookie) {
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
            inspect(pt.myAggregateData);
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
    var agencyName = req.body.agencyName;
    // console.log("agency change: "+agency);    
    req.mySession.agencyCookie=agency;
    req.mySession.agencyCookieName=agencyName;
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
    var agency = req.body.agency,
        agencyName = req.body.agencyName;
    var route = req.body.route,
        routeName = req.body.routeName;
    // console.log("route change: "+route);
    req.mySession.agencyCookie=agency;
    req.mySession.agencyCookieName=agencyName;
    req.mySession.routeCookie=route;
    req.mySession.routeCookieName=routeName;
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
    var agency = req.body.agency,
        agencyName = req.body.agencyName;
    var route = req.body.route,
        routeName = req.body.routeName;
    var direction = req.body.direction,
        directionName = req.body.directionName;
    // console.log("route direction: "+direction);
    req.mySession.agencyCookie=agency;
    req.mySession.agencyCookieName=agencyName;
    req.mySession.routeCookie=route;
    req.mySession.routeCookieName=routeName;
    req.mySession.directionCookie=direction;
    req.mySession.directionCookieName=directionName;
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
    var agency = req.body.agency,
        agencyName = req.body.agencyName;
    var route = req.body.route,
        routeName = req.body.routeName;
    var direction = req.body.direction,
        directionName = req.body.directionName;
    var stop = req.body.stop,
        stopName = req.body.stopName;
    // console.log("change stop: "+stop);
    req.mySession.agencyCookie=agency;
    req.mySession.agencyCookieName=agencyName;
    req.mySession.routeCookie=route;
    req.mySession.routeCookieName=routeName;
    req.mySession.directionCookie=direction;
    req.mySession.directionCookieName=directionName;
    req.mySession.stopCookie=stop;
    req.mySession.stopCookieName=stopName;

    pt = null;
    pt = new PublicTransit();
    pt.predictionsRequest(pt.stopListUrl+agency+"&r="+route+"&s="+stop+"&useShortTitles=true", function(data) {
      // inspect("This is what myAggregateData looks like after stop change by user->");
      // inspect(pt.myAggregateData);
      res.send(pt.myAggregateData);
    });
});


function getCurrentTime() {
  var currentdate = new Date();

  // For todays date;
  Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + 
            (this.getMonth()+1) +"/"+ this.getFullYear();
  }

  Date.prototype.timeNow = function(){     
    return ((this.getHours() < 10)?"0":"") + ((this.getHours()>12)?(this.getHours()-12):this.getHours()) +
            ":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + 
            this.getSeconds() + ((this.getHours()>12)?('PM'):'AM'); 
  }

  return currentdate.timeNow();
}


module.exports = router;
