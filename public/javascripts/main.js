$(function(){
	var source = $("#search-results").html();
	var dataTemplate = Handlebars.compile(source);
	$results = $('#results');

	$('#search').on('keyup', function(e){
		if(e.keyCode === 13) {
		 var parameters = { search: $(this).val() };

			$.get('/searching', parameters, function(data){
			    if (data instanceof Array) {
			    	$results.html( dataTemplate({resultsArray:data}) );	
			    } else {
			    	$results.html(data);
			    }
			});

		}
	});

	$.ajax({
		type: "GET",
		url: "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList",
		dataType: "xml",
		success: xmlParser
	});
});

function xmlParser(xml) {
	$(xml).find("agency").each(function() {
		$('#results').append('<li>'+$(this).attr('title')+'</li>');
	});
}