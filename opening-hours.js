(function ($) {
	
// messages (ready for translation)
	var messages = [];
	messages['open'] = 'open';
	messages['closed'] = 'closed';
	messages['closing_in'] = 'we are closing';
	messages['opening_in'] = 'we are opening';
	messages['tomorrow'] = 'tomorrow';
	messages['in'] = 'in';
	messages['days'] = 'days';
	messages['at'] = 'at';
	messages['hours'] = 'h.';
	messages['minutes'] = 'min.';
	messages['and'] = '';
	
// constants
	var searchLimit = 7;

	function toMinutes(hourWithMinutes) {
		var hours = Math.floor(hourWithMinutes);
		var minutes = 100 * (hourWithMinutes - hours);
		return Math.floor(hours * 60 + minutes);
	};

	var hourInsideRange = function (hour, range) {
		if ($.isArray(range)) {
			var fromEncoded = range[0];
			var toEncoded = range[1];

			var fromMinutesCnt = toMinutes(fromEncoded);
			var toMinutesCnt = toMinutes(toEncoded);

			var hourMinutes = toMinutes(hour);

			return hourMinutes >= fromMinutesCnt && hourMinutes <= toMinutesCnt;

		} else {
			return false;
		}
	};

	var getCurrentStatus = function (data) {

		var settings = data.hours;
		var values = getSettingsForToday(data)
		if (values) {
			var status = false;
			var now = getCurrentHourFormatted();
			$.each(values, function (index, value) {
				status = status || hourInsideRange(now, value);
			});
			return status;
		} else {
			return false;
		} // no entry
	};

	var getCurrentHourFormatted = function () {
		var now = moment().format('H.mm');
		var nowFormatted = parseFloat(now);
		return nowFormatted;
	};

	var after = function (what, afterWhat) {
		var whatToMinutes = toMinutes(what);
		var afterWhatToMinutes = toMinutes(afterWhat);
		return whatToMinutes > afterWhatToMinutes;
	};

	var getSettingsForToday = function (data, plusDays) {
		if (!plusDays) { plusDays = 0; }
		var selectedDay = moment().add(plusDays, 'd');
		var weekDay = selectedDay.isoWeekday();
		return data.hours[weekDay];
	};

	var getClosingIn = function (data) {
		var currentStatus = getCurrentStatus(data);
		var currentHour = getCurrentHourFormatted();
		if (currentStatus) {
			// open, we look for closing hour
			for (var i = 0; i < searchLimit; i++) {
				var settings = getSettingsForToday(data, i);
				if (settings){
					for (var j = 0; j < settings.length; j++) {
						var value = settings[j];
						if (!value) break;
						if (!value.length) continue
						if (i > 0 || after(value[1], currentHour)) {
							return { closingIn: toMinutes(24)*i + toMinutes(value[1]) - toMinutes(currentHour) };
						}
					}
				}
			}
		} else {
			// closed, we look for opening hour
			for (var i = 0; i < searchLimit; i++) {
				var settings = getSettingsForToday(data, i);
				if (settings){
					for (var j = 0; j < settings.length; j++) {
						var value = settings[j];
						if (!value) break;
						if (!value.length) continue;
						if (i > 0 || after(value[0], currentHour)) {
							return { openingIn: toMinutes(24)*i + toMinutes(value[0]) - toMinutes(currentHour) };
						}
					}
				}
			}
		}
	};

	var formatIn = function(momentInMinutes){
		var message = '';
		var days = 0;
		var now = toMinutes(getCurrentHourFormatted());

		if (momentInMinutes > 24*60-now){
			var days = Math.floor((momentInMinutes-now) / (24*60));
			if (days <= 1){
				message += messages['tomorrow'];
			} else if (days > 1){
				days++;
				message += messages['in'] + ' ' + days + ' ' + messages['days'];
			}

		} else {
			var remainingHours = Math.floor(momentInMinutes/60);
			var remainingMinutes = momentInMinutes-60*remainingHours;
			message += messages['in'];
			if (remainingHours > 0){
				message += ' '+remainingHours+' '+messages['hours']+' '+messages['and'] + ' ';
			}
			message += remainingMinutes + ' '+messages['minutes'];

		}

		// now the hour
		var minutes = now + momentInMinutes - days*24*60;
		var fullHours = Math.floor(minutes/60);
		var rest = minutes % 60;
	
		message += ' ' + messages['at'] + ' ' + fullHours + ':' + rest;

		return message;
	}

	var getFormattedResult = function (data) {
		if (data.show === 'closing-in') {
			var closingIn = getClosingIn(data);
			if (closingIn.closingIn) {
				return messages['closing_in'] + ' ' + formatIn(closingIn.closingIn);
			} else if (closingIn.openingIn) {
				return messages['opening_in'] + ' ' + formatIn(closingIn.openingIn);
			} else {
				return 'Unknown!';
			}
		} else {
			// default
			if (getCurrentStatus(data)) {
				return messages['open'];
			} else {
				return messages['closed'];
			}
		}
	};

	var validateHour = function(formattedHour){
		var hourPart = Math.floor(formattedHour);
		var minutePart = Math.floor((minutePart-hourPart)*100);
		if (hourPart > 23) console.warn('invalid time format (hour part > 23) in '+formattedHour);
		if (hourPart < 0) console.warn('invalid time format (hour part < 0) in '+formattedHour);
		if (minutePart > 59) console.warn('invalid time format (minute part > 59) in '+formattedHour);
	};

	var validateData = function(data){
		if (!data) console.warn('options object is undefined!');
		if (!data.hours) console.warn('undefined hours!');
		for (var i = 0; i < data.hours.length; i++){
			if ($.isArray(data.hours[i])){
				for (var j = 0; j < data.hours[i].length; j++){
					var h = data.hours[i][j];
					if (!$.isArray(h)) console.warn('object "'+h+'" in weekday "'+i+'" is not an array!');
					else if (h.length != 2) console.warn('array of hours for weekday "'+i+'" is not of length 2 (opening and closing hour)');
					else {
						validateHour(h[0]);
						validateHour(h[1]);
					}
				}
			}
		}
	};

	$.fn.openingHours = function (data) {
		validateData(data);
		return this.append(getFormattedResult(data));
	};

})(jQuery);