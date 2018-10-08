(function ($) {
  var WEEK_DAYS_LENGTH = 7;
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
    and: '',
    weekDays: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]
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

  function getSettingsForToday(hours, plusDays) {
    if (!plusDays) {
      plusDays = 0;
    }
    var selectedDay = moment().add(plusDays, 'd');
    var weekDay = selectedDay.isoWeekday();
    return hours[daysMap[weekDay]];
  }

  function getCurrentHourFormatted() {
    var now = moment().format('H.mm');
    return parseFloat(now);
  }

  function daysInMinutes(days) {
    return toMinutes(24) * days;
  }

  function toMinutes(hourWithMinutes) {
    var hours = Math.floor(hourWithMinutes);
    var minutes = Math.round(hourWithMinutes * 100) - Math.round(100 * hours);
    return Math.floor(hours * 60 + minutes);
  }

  function isCurrentlyOpen(hours) {
    var values = getSettingsForToday(hours);
    if (values) {
      var status = false;
      var now = getCurrentHourFormatted();
      $.each(values, function (index, value) {
        status = status || hourInsideRange(now, value);
      });
      return status;
    }
    return false;

    function hourInsideRange(hour, range) {
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
    }
  }

  var closingInAction = function (hours) {
    var closingIn = getTimeToCloseOrOpen(hours);
    if (closingIn.closingIn) {
      return messages.closing_in + ' ' + formatIn(closingIn.closingIn);
    }
    if (closingIn.openingIn) {
      return messages.opening_in + ' ' + formatIn(closingIn.openingIn);
    }
    return 'Unknown!';

    function formatIn(momentInMinutes) {
      var messageParts = [];
      var destinationTime = moment().add(momentInMinutes, 'minutes');
      if (destinationTime.isSame(moment(), 'day')) {
        var diffTime = destinationTime.diff(moment());
        var durationTime = moment.duration(diffTime);
        var durationInHours = durationTime.asHours();
        var durationInMinutes = durationTime.asMinutes();
        messageParts.push(messages.in);
        if (durationInHours >= 1) {
          var hoursOnly = Math.floor(durationInHours);
          messageParts.push(hoursOnly + ' h.');
          durationInMinutes -= hoursOnly * 60;
        }
        if (durationInMinutes >= 1) {
          messageParts.push(durationInMinutes + ' min.');
        }
        messageParts.push(messages.at);
        messageParts.push(destinationTime.format('H:mm'));
        return messageParts.join(' ').trim();
      }
      return destinationTime.calendar(moment()).trim();
    }

    function after(what, afterWhat) {
      var whatToMinutes = toMinutes(what);
      var afterWhatToMinutes = toMinutes(afterWhat);
      return whatToMinutes > afterWhatToMinutes;
    }

    function getTimeToCloseOrOpen(hours) {
      if (isCurrentlyOpen(hours)) {
        return {
          closingIn: getHours('open')
        };
      }
      return {
        openingIn: getHours('closed')
      };

      function getHours(type) {
        var result;
        var plusDayIndex = 0;
        var typeIndex = type === 'open' ? 1 : 0;
        var currentHour = getCurrentHourFormatted();
        for (plusDayIndex; plusDayIndex < WEEK_DAYS_LENGTH; plusDayIndex++) {
          var daySettings = getSettingsForToday(hours, plusDayIndex);
          if (daySettings) {
            $.each(daySettings, function (i, hoursArray) {
              if (!hoursArray || !hoursArray.length) {
                return;
              }
              if (plusDayIndex > 0 || after(hoursArray[typeIndex], currentHour)) {
                result = (daysInMinutes(plusDayIndex) + toMinutes(hoursArray[typeIndex]) - toMinutes(currentHour));
                return false;
              }
            });
            if (result) {
              return result;
            }
          }
        }
      }
    }
  };

  var addMessages = function (messagesFromData) {
    if (messagesFromData) {
      $.each(messages, function (key) {
        if (messagesFromData[key]) {
          messages[key] = messagesFromData[key];
        }
      })
    }
  };

  var currentStatusAction = function (hours) {
    if (isCurrentlyOpen(hours)) {
      return messages['open'];
    }
    return messages['closed'];
  };
  var configureMoment = function () {
    if($.inArray('ourLocale', moment.locales()) === -1){
      moment.defineLocale('ourLocale', {parentLocale: 'pl'});
      moment.locale('ourLocale');
      moment.updateLocale('ourLocale', {
        meridiem: function () {
          return '';
        },
        calendar: {
          nextDay: '[' + messages.tomorrow + '] [' + messages.at + '] H:mm',
          sameDay: '[' + messages.at + '] H:mm',
          nextWeek: '[' + messages.in + '] dddd [' + messages.at + '] H:mm'
        },
        weekdays: messages.weekDays
      });
    }
  };
  var getFormattedResult = function (data) {
    if (data.show === 'closing-in') {
      return closingInAction(data.hours)
    }
    if (data.show === 'current-status') {
      return currentStatusAction(data.hours)
    }
    throw (data.show + 'is not correct option');
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
      var minutePart = Math.floor(((100 * formattedHour) - (hourPart * 100)));
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

  function renderOutput($container, output) {
    return $container.append(output);
  }

  $.fn.openingHours = function (data) {
    try {
      validateData(data);
      addMessages(data.messages);
      configureMoment();
      return renderOutput(this, getFormattedResult(data));
    } catch (e) {
      console.warn(e);
      return renderOutput(this, 'Error!');
    }
  };

})(jQuery);