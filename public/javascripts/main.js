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
		var parameters = { 
			agency: $('#agencyList option:selected').attr('id'), 
			route: $('#routeList option:selected').attr('id'),
			direction: $('#directionList option:selected').attr('id'),
			stop: $('#stopList option:selected').attr('id')};
		window.location.replace("/agencies/"+parameters.agency+"/"+parameters.route+"/"+parameters.direction+"/"+parameters.stop);
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