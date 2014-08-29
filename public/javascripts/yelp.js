$(function(){
	var inputSource = $("#yelp-results").html(),
		dataTemplate = Handlebars.compile(inputSource);

	$results = $('#results');
	// loading gif goes here //
	$('#loading').show();

	$.post('/yelp/yelpSearch-mobile', function(data) {
		// $agencyList.html( optionsTemplate(data[0]) );
		// $routeList.html( routeTemplate(data[1]) );
		// $directionList.html( directionTemplate(data[2]) );	
		// $stopList.html( stopsTemplate(data[3]) );	
		// $predictions.html( predictionsTemplate(data[4]) );
		// loading gif ends here //
		$('#loading').hide();
	});

	$('#search').on('keyup', function(e){
		if(e.keyCode === 13) {
		 var parameters = { search: $(this).val() };

			$.get('/yelp/searching', parameters, function(data){
				console.log("test parameters here-> "+data);
			    // if (data instanceof Array) {
			    	console.log(data);
			    	$results.html( dataTemplate(data) );	
			    // } else {
			    // 	console.log("in the else");
			    // 	$results.html(data);
			    // }
			});
		}
	});
});