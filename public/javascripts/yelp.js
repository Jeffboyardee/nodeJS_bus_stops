$(function(){
	var inputSource = $("#yelp-results").html(),
		dataTemplate = Handlebars.compile(inputSource);

	// loading gif goes here //
	$('#loading').show();

	$.post('/mobile/yelpSearch-mobile', function(data) {
		$agencyList.html( optionsTemplate(data[0]) );
		$routeList.html( routeTemplate(data[1]) );
		$directionList.html( directionTemplate(data[2]) );	
		$stopList.html( stopsTemplate(data[3]) );	
		$predictions.html( predictionsTemplate(data[4]) );
		// loading gif ends here //
		$('#loading').hide();
	});
	
});