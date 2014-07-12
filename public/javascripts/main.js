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

	$.get("http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList", function(xml) {
		xmlParser(xml);
	});

	$( "#agencyList" ).change(function() {
		$.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a="+$('#agencyList option:selected').attr('id'), function(xml) {
			xmlParserRoute(xml);
		}).done(function() {
			$.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a="+$('#agencyList option:selected').attr('id')+"&r="+$('#routeList option:selected').attr('id'), function(xml) {
				xmlParserDirection(xml);
			});	
		});
				
	});
});

function xmlParser(xml) {
	$(xml).find("agency").each(function() {
		$('#agencyList').append('<option id="'+$(this).attr('tag')+'" class="'+$(this).attr('regionTitle')+'">'+$(this).attr('title')+'</option>');
	});
}

function xmlParserRoute(xml) {
	var options='';

	$(xml).find("route").each(function() {		
		options += '<option id="'+$(this).attr('tag')+'">'+$(this).attr('title')+'</option>';
	});
	$('#routeList').html(options);
}

function xmlParserDirection(xml) {
	var options='';
	var optionsArray=[];

	$(xml).find("direction").each(function() {		
		options += '<option id="'+$(this).attr('name')+'">'+$(this).attr('title')+'</option>';
		optionsArray.push(
			{name:$(this).attr('name'), title:$(this).attr('title')}
		);
	});
	$('#directionList').html(options);

	xmlParserStop(xml,optionsArray);
}

function xmlParserStop(xml,optionsArray) {
	var options='';

	console.log(optionsArray);
	$(xml).find("direction[name="+optionsArray[0].name+"] stop").each(function() {
		options += '<option>'+$(xml).find('stop[tag='+$(this).attr('tag')+']').attr('title')+'</option>';

		console.log('stops');
	});
	$('#stopList').html(options);
}