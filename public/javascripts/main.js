$(function(){
	$.get('/agencySearch', function(data) {
		var tempString = data["agencyName"],
			tempString1 = data["routeName"],
			tempString2 = data["directionName"],
			tempString3 = data["stopsName"];
		window.location.replace("/agencies/"+tempString+"/"+tempString1+"/"+tempString2+"/"+tempString3);
	});
});