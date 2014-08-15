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
	var autoPredictCount=0;

	$results = $('#results');
	$agencyList = $('#agencyList');
	$routeList = $('#routeList');
	$directionList = $('#directionList');
	$stopList = $('#stopList');
	$predictions = $('#predictions');

	// loading gif goes here //
	$('#loading').show();

	$.post('/mobile/agencySearch-mobile', function(data) {
		$agencyList.html( optionsTemplate(data[0]) );
		$routeList.html( routeTemplate(data[1]) );
		$directionList.html( directionTemplate(data[2]) );	
		$stopList.html( stopsTemplate(data[3]) );	
		$predictions.html( predictionsTemplate(data[4]) );
		// loading gif ends here //
		$('#loading').hide();
	});

	$( "#agencyList" ).change(function() {
		var parameters = { agency: $('#agencyList option:selected').attr('id') };
		$('#routeList').attr('disabled', true);
		$('#directionList').attr('disabled', true);
		$('#stopList').attr('disabled', true);
		// loading gif goes here //
		$('#loading').show();

		$.post('/mobile/agencySearchMobile-change-agency', parameters, function(data) {
			console.log("success from server");
			$routeList.html( routeTemplate(data[0]) );
			$directionList.html( directionTemplate(data[1]) );	
			$stopList.html( stopsTemplate(data[2]) );	
			$predictions.html( predictionsTemplate(data[3]) );
			$('#routeList').attr('disabled', false);
			$('#directionList').attr('disabled', false);
			$('#stopList').attr('disabled', false);			
			// loading gif ends here //
			$('#loading').hide();
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
		$('#agencyList').attr('disabled', true);
		$('#directionList').attr('disabled', true);
		$('#stopList').attr('disabled', true);
		// loading gif goes here //
		$('#loading').show();

		$.post('/mobile/agencySearchMobile-change-route', parameters, function(data) {
			console.log("success from server");
			$directionList.html( directionTemplate(data[0]) );	
			$stopList.html( stopsTemplate(data[1]) );	
			$predictions.html( predictionsTemplate(data[2]) );
			$('#agencyList').attr('disabled', false);
			$('#directionList').attr('disabled', false);
			$('#stopList').attr('disabled', false);		
			// loading gif ends here //
			$('#loading').hide();	
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
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#stopList').attr('disabled', true);
		// loading gif goes here //
		$('#loading').show();

		$.post('/mobile/agencySearchMobile-change-direction', parameters, function(data) {
			console.log("success from server");
			$stopList.html( stopsTemplate(data[0]) );	
			$predictions.html( predictionsTemplate(data[1]) );
			$('#agencyList').attr('disabled', false);
			$('#routeList').attr('disabled', false);
			$('#stopList').attr('disabled', false);
			// loading gif ends here //
			$('#loading').hide();
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
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#directionList').attr('disabled', true);	
		// loading gif goes here //
		$('#loading').show();	

		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");
			$predictions.html( predictionsTemplate(data[0]) );
			$('#agencyList').attr('disabled', false);
			$('#routeList').attr('disabled', false);
			$('#directionList').attr('disabled', false);	
			// loading gif ends here //
			$('#loading').hide();	
		})
		.fail(function() {
			console.log("error from server");
		});
	});

	$('#reload').click(function (){
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')
		};
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#directionList').attr('disabled', true);	
		$('#stopList').attr('disabled', true);	
		// loading gif goes here //
		$('#loading').show();	

		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");
			$predictions.html( predictionsTemplate(data[0]) );
			$('#agencyList').attr('disabled', false);
			$('#routeList').attr('disabled', false);
			$('#directionList').attr('disabled', false);	
			$('#stopList').attr('disabled', false);	
			// loading gif ends here //
			$('#loading').hide();	
		})
		.fail(function() {
			console.log("error from server");
		});
	});

	var autoPredict = setInterval(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')
		};
		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");
			$predictions.html( predictionsTemplate(data[0]) );
			$('#agencyList').attr('disabled', false);
			$('#routeList').attr('disabled', false);
			$('#directionList').attr('disabled', false);	
			$('#stopList').attr('disabled', false);	
		})
		.fail(function() {
			autoPredictCount++;
			console.log("error from server");
			if (autoPredictCount == 3)
				window.clearInterval(autoPredict);
		});
	}, 5000);	// 10 seconds
});