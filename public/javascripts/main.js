$(function(){
	var source = $("#search-results").html(),
	dataTemplate = Handlebars.compile(source),
	agencyListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList",
	routeListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=",
	directionListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=",
	stopListUrl = "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=";

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
	$.get(agencyListUrl, function(xml) {
		xmlParser(xml);
	});
	$( "#agencyList" ).change(function() {
		$.get(routeListUrl+$('#agencyList option:selected').attr('id'), function(xml) { xmlParserRoute(xml); }).done(function() {
			$.get(directionListUrl+$('#agencyList option:selected').attr('id')+"&r="+$('#routeList option:selected').attr('id'), function(xml) {
				xmlParserDirection(xml);
			}).done(function() {
				$.get(stopListUrl+$('#agencyList option:selected').attr('id')+'&r='+$('#routeList option:selected').attr('id')+'&s='+$('#stopList option:selected').attr('stoptag')+'&useShortTitles=true', function(xml) {
					xmlParserTime(xml);
				});
			});	
		});	
	});
	$( "#routeList" ).change(function() {
		$.get(directionListUrl+$('#agencyList option:selected').attr('id')+"&r="+$('#routeList option:selected').attr('id'), function(xml) {
			xmlParserDirection(xml);
		}).done(function() {
			$.get(stopListUrl+$('#agencyList option:selected').attr('id')+'&r='+$('#routeList option:selected').attr('id')+'&s='+$('#stopList option:selected').attr('stoptag')+'&useShortTitles=true', function(xml) {
				xmlParserTime(xml);
			});
		});
	});
	$( "#directionList" ).change(function() {
		$directionSelected = $('#directionList option:selected').attr('id');
		$.get(directionListUrl+$('#agencyList option:selected').attr('id')+"&r="+$('#routeList option:selected').attr('id'), function(xml) {
			xmlParserStop(xml,null,$directionSelected);
		}).done(function() {
			$.get(stopListUrl+$('#agencyList option:selected').attr('id')+'&r='+$('#routeList option:selected').attr('id')+'&s='+$('#stopList option:selected').attr('stoptag')+'&useShortTitles=true', function(xml) {
				xmlParserTime(xml);
			});
		});
	});	
	$('#stopList').change(function() {
		$.get(stopListUrl+$('#agencyList option:selected').attr('id')+'&r='+$('#routeList option:selected').attr('id')+'&s='+$('#stopList option:selected').attr('stoptag')+'&useShortTitles=true', function(xml) {
			xmlParserTime(xml);
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
		options += '<option id="'+$(this).attr('tag')+'">'+$(this).attr('title')+'</option>';
		optionsArray.push(
			{tag:$(this).attr('tag'), title:$(this).attr('title')}
		);
	});
	$('#directionList').html(options);
	xmlParserStop(xml,optionsArray);
}

function xmlParserStop(xml,optionsArray,directionSelected) {
	var options='';
	
	if (typeof directionSelected == 'undefined') {
		$directionSelected = 0;
		$(xml).find("direction[tag="+optionsArray[$directionSelected].tag+"] stop").each(function() {
			options += '<option stopTag='+$(this).attr('tag')+'>'+$(xml).find('stop[tag='+$(this).attr('tag')+']').attr('title')+'</option>';
		});		
	} else {
		$directionSelected = directionSelected;
		$(xml).find("direction[tag="+$('#directionList option:selected').attr('id')+"] stop").each(function() {
			options += '<option stopTag='+$(this).attr('tag')+'>'+$(xml).find('stop[tag='+$(this).attr('tag')+']').attr('title')+'</option>';
		});
	}

	$('#stopList').html(options);	
}

function xmlParserTime(xml) {
	var timeArrival = '';
	var stopTag = $('#stopList option:selected').attr('stoptag');

	$(xml).find("prediction").each(function() {
		timeArrival += '<p>'+$(this).attr('minutes')+' min</p>';
	});

	$('#timebox').html(timeArrival);
}