define(['jquery', 'moment'], function ($, moment) {
  'use strict';

  describe('openingHours', function () {
    var defaultConf = {
      show: 'closing-in',
      hours: {
        monday: [[8.30, 18.30]]
      }
    };
    var $defaultDiv;
    beforeEach(function(){
      $defaultDiv = $('<div />', {
        class: 'test'
      });
    });

    it("should show opening tomorrow", function (done) {
      window.moment = function () {
        return moment('07-10-2018 17:40', 'DD-MM-YYYY hh:mm')
      };
      registerOpeningHours(function () {
        $defaultDiv.openingHours(defaultConf);
        expect($defaultDiv.html()).toBe('we are opening tomorrow at 8:30');
        done();
      });
    });


    it("should show opening in two days", function (done) {
      window.moment = function () {
        return moment('06-10-2018 17:40', 'DD-MM-YYYY hh:mm')
      };
      registerOpeningHours(function () {
        $defaultDiv.openingHours(defaultConf);
        expect($defaultDiv.html()).toBe('we are opening in two days at 8:30');
        done();
      });
    });
  });

  function registerOpeningHours(callback) {
    require(['opening-hours'], function () {
      callback();
    })
  }
});
