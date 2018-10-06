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

  var daysMap = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
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

  var addMessages = function (data) {
    if (data.messages) {
      $.each(messages, function (key) {
        if (data.messages[key]) {
          messages[key] = data.messages[key];
        }
      })
    }
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
    return data.hours[daysMap[weekDay]];
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
      var typeIndex = type === 'open' ? 1 : 0;
      var currentHour = getCurrentHourFormatted();
      for (var i = 0; i < searchLimit; i++) {
        settings = getSettingsForToday(data, i);
        if (settings) {
          for (var j = 0; j < settings.length; j++) {
            value = settings[j];
            if (!value) break;
            if (!value.length) continue;
            if (i > 0 || after(value[typeIndex], currentHour)) {
              return toMinutes(24) * i + toMinutes(value[typeIndex]) - toMinutes(currentHour);
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
        return messages.closing_in + ' ' + formatIn(closingIn.closingIn);
      }
      if (closingIn.openingIn) {
        return messages.opening_in + ' ' + formatIn(closingIn.openingIn);
      }
      return 'Unknown!';
    }
    // default
    if (getCurrentStatus(data)) {
      return messages['open'];
    }
    return messages['closed'];
  };

  var validateData = function (data) {
    if (!data) {
      throw 'options object is undefined!';
    }
    if (!data.hours) {
      throw 'undefined hours!';
    }
    $.each(data.hours, function (key, values) {
      if (!$.isArray(values)) {
          throw 'hours values should be array!'
      }
      for (var j = 0; j < values.length; j++) {
        var hours = values[j];
        if (!$.isArray(hours)) {
          throw ('element "' + hours + '" in weekday "' + key + '" is not an array!');
        }
        if (hours.length !== 2) {
          throw ('array of hours for weekday "' + key + '" is not of length 2 (opening and closing hour)');
        }
        validateHour(hours[0]);
        validateHour(hours[1]);
      }
    });
    function validateHour(formattedHour) {
      var hourPart = Math.floor(formattedHour);
      var minutePart = Math.floor(((100*formattedHour) - (hourPart*100)));
      if (hourPart > 23) {
        throw('invalid time format (hour part > 23) in ' + formattedHour);
      }
      if (hourPart < 0) {
        throw('invalid time format (hour part < 0) in ' + formattedHour);
      }
      if (minutePart > 59) {
        throw('invalid time format (minute part > 59) in ' + formattedHour);
      }
    }
  };

  function renderOutput($container, data){
    return $container.append(data);
  }
  $.fn.openingHours = function (data) {
    try{
      validateData(data);
      addMessages(data);
      return renderOutput(this, getFormattedResult(data));
    }catch(e){
      console.warn(e);
      return renderOutput(this, 'Error!');
    }
  };

})(jQuery);