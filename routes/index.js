var express = require('express');
var router = express.Router();
var request = require('request');

var agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList",
	routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=",
	directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=",
	stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";


/* GET home page. */
// router.get('/', function(req, res) {
// 	res.render('index', { title: 'Express' });
// });






module.exports = router;
