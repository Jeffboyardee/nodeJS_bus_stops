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
		data[4]['timeUpdated'] = getCurrentTime();		
		$predictions.html( predictionsTemplate(data[4]) );
		// loading gif ends here //
		$('#loading').hide();
	});

	$( "#agencyList" ).change(function() {
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'),
			agencyName: $('#agencyList option:selected').html() 
		};
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
			data[3]['timeUpdated'] = getCurrentTime();
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
			agencyName: $('#agencyList option:selected').html(), 
			route: $('#routeList option:selected').attr('id'),
			routeName: $('#routeList option:selected').html()
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
			data[2]['timeUpdated'] = getCurrentTime();
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
			agencyName: $('#agencyList option:selected').html(), 
			route: $('#routeList option:selected').attr('id'),
			routeName: $('#routeList option:selected').html(),
			direction: $('#directionList option:selected').attr('id'),
			directionName: $('#directionList option:selected').html() 
		};
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#stopList').attr('disabled', true);
		// loading gif goes here //
		$('#loading').show();

		$.post('/mobile/agencySearchMobile-change-direction', parameters, function(data) {
			console.log("success from server");

			$stopList.html( stopsTemplate(data[0]) );	
			data[1]['timeUpdated'] = getCurrentTime();
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
			agencyName: $('#agencyList option:selected').html(), 
			route: $('#routeList option:selected').attr('id'),
			routeName: $('#routeList option:selected').html(),
			direction: $('#directionList option:selected').attr('id'),
			directionName: $('#directionList option:selected').html(),
			stop: $('#stopList option:selected').attr('id'),
			stopName: $('#stopList option:selected').html()
		};
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#directionList').attr('disabled', true);	
		// loading gif goes here //
		$('#loading').show();	

		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");

			data[0]['timeUpdated'] = getCurrentTime();
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
			agencyName: $('#agencyList option:selected').html(), 
			route: $('#routeList option:selected').attr('id'),
			routeName: $('#routeList option:selected').html(),
			direction: $('#directionList option:selected').attr('id'),
			directionName: $('#directionList option:selected').html(),
			stop: $('#stopList option:selected').attr('id'),
			stopName: $('#stopList option:selected').html()
		};
		$('#agencyList').attr('disabled', true);
		$('#routeList').attr('disabled', true);
		$('#directionList').attr('disabled', true);	
		$('#stopList').attr('disabled', true);	
		// loading gif goes here //
		$('#loading').show();	

		$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
			console.log("success from server");

			data[0]['timeUpdated'] = getCurrentTime();
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

	// var autoPredict = setInterval(function() {
	// 	var parameters = { 
	// 		agency: $('#agencyList option:selected').attr('id'), 
	// 		route: $('#routeList option:selected').attr('id'),
	// 		direction: $('#directionList option:selected').attr('id'),
	// 		stop: $('#stopList option:selected').attr('id')
	// 	};
	// 	$.post('/mobile/agencySearchMobile-change-stop', parameters, function(data) {
	// 		console.log("success from server");
	// 		$predictions.html( predictionsTemplate(data[0]) );
	// 		$('#agencyList').attr('disabled', false);
	// 		$('#routeList').attr('disabled', false);
	// 		$('#directionList').attr('disabled', false);	
	// 		$('#stopList').attr('disabled', false);	
	// 	})
	// 	.fail(function() {
	// 		autoPredictCount++;
	// 		console.log("error from server");
	// 		if (autoPredictCount == 3)
	// 			window.clearInterval(autoPredict);
	// 	});
	// }, 10000);	// 10 seconds
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