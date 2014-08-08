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

	$.post(location.pathname, function(data) {
		$agencyList.html( optionsTemplate(data[0]) );
		$routeList.html( routeTemplate(data[1]) );
		$directionList.html( directionTemplate(data[2]) );	
		$stopList.html( stopsTemplate(data[3]) );	
		$predictions.html( predictionsTemplate(data[4]) );
	});

	$('#search').on('keyup', function(e){
		if(e.keyCode === 13) {
		 var parameters = { search: $(this).val() };

			$.get('/desktop/searching', parameters, function(data){
				console.log("test parameters here-> "+data);
			    if (data instanceof Array) {
			    	$results.html( dataTemplate({resultsArray:data}) );	
			    } else {
			    	$results.html(data);
			    }
			});
		}
	});

	$( "#agencyList" ).change(function() {
		var parameters = { agency: $('#agencyList option:selected').attr('id') };

		$.get('/desktop/agencySearchRoute', parameters, function(data) {
			var tempString = data["agencyName"],
				tempString1 = data["routeName"],
				tempString2 = data["directionName"],
				tempString3 = data["stopsName"];
			window.location.replace("/desktop/agencies/"+tempString+"/"+tempString1+"/"+tempString2+"/"+tempString3);
		});
	});
	$( "#routeList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id') 
		};

		$.get('/desktop/routeSearchDirection', parameters, function(data) {
			var tempString = data["agencyName"],
				tempString1 = data["routeName"],
				tempString2 = data["directionName"],
				tempString3 = data["stopsName"];
			window.location.replace("/desktop/agencies/"+tempString+"/"+tempString1+"/"+tempString2+"/"+tempString3);
		});
	});
	$( "#directionList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id') 
		};

		$.get('/desktop/directionSearchStop', parameters, function(data) {
			var tempString = data["agencyName"],
				tempString1 = data["routeName"],
				tempString2 = data["directionName"],
				tempString3 = data["stopsName"];
			window.location.replace("/desktop/agencies/"+tempString+"/"+tempString1+"/"+tempString2+"/"+tempString3);
		});
	});	
	$('#stopList').change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')
		};

		$.get('/desktop/stopSearchPrediction', parameters, function(data) {
			var tempString = data["agencyName"],
				tempString1 = data["routeName"],
				tempString2 = data["directionName"],
				tempString3 = data["stopsName"];
			window.location.replace("/desktop/agencies/"+tempString+"/"+tempString1+"/"+tempString2+"/"+tempString3);
		});
	});
});