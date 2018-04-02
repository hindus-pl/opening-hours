(function ($) {
    /**
     * messages ready for translations
     */
    var messages = {
        open: 'open',
        closed: 'closed',
        closing_in: 'we are closing',
        opening_in: 'we are opening',
        tomorrow: 'tomorrow',
        in: 'in',
        days: 'days',
        at: 'at',
        hours: 'h.',
        minutes: 'min.',
        and: ''
    };
    /**
     * constants
     */
    var searchLimit = 7;

    function toMinutes(hourWithMinutes) {
        var hours = Math.floor(hourWithMinutes);
        var minutes = 100 * (hourWithMinutes - hours);
        return Math.floor(hours * 60 + minutes);
    }

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
        var values = getSettingsForToday(data);
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
        return parseFloat(now);
    };

    var after = function (what, afterWhat) {
        var whatToMinutes = toMinutes(what);
        var afterWhatToMinutes = toMinutes(afterWhat);
        return whatToMinutes > afterWhatToMinutes;
    };

    var getSettingsForToday = function (data, plusDays) {
        if (!plusDays) {
            plusDays = 0;
        }
        var selectedDay = moment().add(plusDays, 'd');
        var weekDay = selectedDay.isoWeekday();
        return data.hours[weekDay];
    };

    var getClosingIn = function (data) {
        var currentStatus = getCurrentStatus(data);
        if (currentStatus) {
            return {
                closingIn: getHours('open')
            };
        }
        return {
            openingIn: getHours('closed')
        };

        function getHours(type) {
            var value;
            var settings;
            var i;
            var typeIndex = type === 'open' ? 1 : 0;
            var currentHour = getCurrentHourFormatted();
            for (i = 0; i < searchLimit; i++) {
                settings = getSettingsForToday(data, i);
                if (settings) {
                    for (var j = 0; j < settings.length; j++) {
                        value = settings[j];
                        if (!value) break;
                        if (!value.length) continue;
                        if (i > 0 || after(value[typeIndex], currentHour)) {
                            return {openingIn: toMinutes(24) * i + toMinutes(value[typeIndex]) - toMinutes(currentHour)};
                        }
                    }
                }
            }
        }
    };

    var formatIn = function (momentInMinutes) {
        var message = '';
        var days = 0;
        var now = toMinutes(getCurrentHourFormatted());

        if (momentInMinutes > 24 * 60 - now) {
            days = Math.floor((momentInMinutes - now) / (24 * 60));
            if (days <= 1) {
                message += messages['tomorrow'];
            } else if (days > 1) {
                days++;
                message += messages['in'] + ' ' + days + ' ' + messages['days'];
            }

        } else {
            var remainingHours = Math.floor(momentInMinutes / 60);
            var remainingMinutes = momentInMinutes - 60 * remainingHours;
            message += messages['in'];
            if (remainingHours > 0) {
                message += ' ' + remainingHours + ' ' + messages['hours'] + ' ' + messages['and'] + ' ';
            }
            message += remainingMinutes + ' ' + messages['minutes'];

        }

        // now the hour
        var minutes = now + momentInMinutes - days * 24 * 60;
        var fullHours = Math.floor(minutes / 60);
        var rest = minutes % 60;

        message += ' ' + messages['at'] + ' ' + fullHours + ':' + rest;

        return message;
    };

    var getFormattedResult = function (data) {
        if (data.show === 'closing-in') {
            var closingIn = getClosingIn(data);
            if (closingIn.closingIn) {
                return messages['closing_in'] + ' ' + formatIn(closingIn.closingIn);
            }
            if (closingIn.openingIn) {
                return messages['opening_in'] + ' ' + formatIn(closingIn.openingIn);
            }
            return 'Unknown!';
        }
        // default
        if (getCurrentStatus(data)) {
            return messages['open'];
        }
        return messages['closed'];
    };

    var validateHour = function (formattedHour) {
        var hourPart = Math.floor(formattedHour);
        var minutePart = Math.floor((minutePart - hourPart) * 100);
        if (hourPart > 23) console.warn('invalid time format (hour part > 23) in ' + formattedHour);
        if (hourPart < 0) console.warn('invalid time format (hour part < 0) in ' + formattedHour);
        if (minutePart > 59) console.warn('invalid time format (minute part > 59) in ' + formattedHour);
    };

    var validateData = function (data) {
        if (!data) console.warn('options object is undefined!');
        if (!data.hours) console.warn('undefined hours!');
        for (var i = 0; i < data.hours.length; i++) {
            if ($.isArray(data.hours[i])) {
                for (var j = 0; j < data.hours[i].length; j++) {
                    var h = data.hours[i][j];
                    if (!$.isArray(h)) console.warn('object "' + h + '" in weekday "' + i + '" is not an array!');
                    else if (h.length !== 2) console.warn('array of hours for weekday "' + i + '" is not of length 2 (opening and closing hour)');
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