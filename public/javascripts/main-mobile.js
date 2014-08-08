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
		predictionsTemplate = Handlebars.compile(predictionSource);

	$results = $('#results');
	$agencyList = $('#agencyList');
	$routeList = $('#routeList');
	$directionList = $('#directionList');
	$stopList = $('#stopList');
	$predictions = $('#predictions');

	$.post('/mobile/agencySearch-mobile', function(data) {
		$agencyList.html( optionsTemplate(data[0]) );
		$routeList.html( routeTemplate(data[1]) );
		$directionList.html( directionTemplate(data[2]) );	
		$stopList.html( stopsTemplate(data[3]) );	
		$predictions.html( predictionsTemplate(data[4]) );
	});

	$( "#agencyList" ).change(function() {
		var parameters = { agency: $('#agencyList option:selected').attr('id') };

		$.post('/mobile/agencySearchMobile-change-agency', parameters, function(data) {
			console.log("success from server");
			$routeList.html( routeTemplate(data[1]) );
			$directionList.html( directionTemplate(data[2]) );	
			$stopList.html( stopsTemplate(data[3]) );	
			$predictions.html( predictionsTemplate(data[4]) );
		})
		.fail(function() {
			console.log("error from server");
		});
	});

	$( "#routeList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id') 
		};

		$.post('/mobile/agencySearchMobile-change-route', parameters, function(data) {
			console.log("success from server");
			$directionList.html( directionTemplate(data[2]) );	
			$stopList.html( stopsTemplate(data[3]) );	
			$predictions.html( predictionsTemplate(data[4]) );
		})
		.fail(function() {
			console.log("error from server");
		});
	});

	$( "#directionList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id') 
		};

		$.post('/mobile/agencySearchMobile-change-direction', parameters, function(data) {
			console.log("success from server");
			$stopList.html( stopsTemplate(data[3]) );	
			$predictions.html( predictionsTemplate(data[4]) );
		})
		.fail(function() {
			console.log("error from server");
		});
	});

	$( "#stopList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')
		};

		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");
			$predictions.html( predictionsTemplate(data[4]) );
		})
		.fail(function() {
			console.log("error from server");
		});
	});
});