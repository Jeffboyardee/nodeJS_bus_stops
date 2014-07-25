$(function(){
	var inputSource = $("#search-results").html(),
	optionsSource = $("#data-results").html(),
	routeSource = $("#route-results").html(),
	directionSource = $("#direction-results").html(),
	stopsSource = $("#stops-results").html(),
	predictionSource = $('#predictions-results').html(),
	dataTemplate = Handlebars.compile(inputSource),
	optionsTemplate = Handlebars.compile(optionsSource),
	routeTemplate = Handlebars.compile(routeSource),
	directionTemplate = Handlebars.compile(directionSource),
	stopsTemplate = Handlebars.compile(stopsSource),
	predictionsTemplate = Handlebars.compile(predictionSource),
	agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList",
	routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=",
	directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=",
	stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";

	$results = $('#results');
	$agencyList = $('#agencyList');
	$routeList = $('#routeList');
	$directionList = $('#directionList');
	$stopList = $('#stopList');
	$timebox = $('#timebox');

	$('#search').on('keyup', function(e){
		if(e.keyCode === 13) {
		 var parameters = { search: $(this).val() };

			$.get('/searching', parameters, function(data){
				console.log("test parameters here-> "+data);
			    if (data instanceof Array) {
			    	$results.html( dataTemplate({resultsArray:data}) );	
			    } else {
			    	$results.html(data);
			    }
			});
		}
	});

	$.get('/agencySearch', function(data) {
		$agencyList.html( optionsTemplate(data[0]) );
		$routeList.html( routeTemplate(data[1]) );
		$directionList.html( directionTemplate(data[2]) );	
		$stopList.html( stopsTemplate(data[3]) );	
		$timebox.html( predictionsTemplate(data[4]) );
	});

	$( "#agencyList" ).change(function() {
		var parameters = { agency: $('#agencyList option:selected').attr('id') };

		$.get('/agencySearchRoute', parameters, function(data) {
			$('routeList option').remove();
			$('directionList option').remove();
			$('stopList option').remove();
			$('timebox option').remove();

			$routeList.html( routeTemplate(data[1]) );
			$directionList.html( directionTemplate(data[2]) );	
			$stopList.html( stopsTemplate(data[3]) );	
			$timebox.html( predictionsTemplate(data[4]) );
		});
		// window.location.replace("/agencies/"+parameters.agency+"/"+parameters.route+"/"+parameters.direction+"/"+parameters.stop);
	});
	$( "#routeList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id') 
		};

		$.get('/routeSearchDirection', parameters, function(data) {
			$('directionList option').remove();
			$('stopList option').remove();
			$('timebox option').remove();

			$directionList.html( directionTemplate(data[1]) );	
			$stopList.html( stopsTemplate(data[2]) );	
			$timebox.html( predictionsTemplate(data[3]) );
		});
		// window.location.replace("/agencies/"+parameters.agency+"/"+parameters.route+"/"+parameters.direction+"/"+parameters.stop);
	});
	$( "#directionList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id') 
		};

		$.get('/directionSearchStop', parameters, function(data) {
			$('stopList option').remove();
			$('timebox option').remove();

			$stopList.html( stopsTemplate(data[0]) );	
			$timebox.html( predictionsTemplate(data[1]) );
		});
		// window.location.replace("/agencies/"+parameters.agency+"/"+parameters.route+"/"+parameters.direction+"/"+parameters.stop);
	});	
	$('#stopList').change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')
		};

		$.get('/stopSearchPrediction', parameters, function(data) {
			$('timebox option').remove();

			$timebox.html( predictionsTemplate(data[0]) );
		});
		// window.location.replace("/agencies/"+parameters.agency+"/"+parameters.route+"/"+parameters.direction+"/"+parameters.stop);
	});
});