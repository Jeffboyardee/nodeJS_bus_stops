'use strict';

var todayDate = document.querySelector('.today_date');
var dateObj = new Date();

todayDate.innerHTML = dateObj.getFullYear();