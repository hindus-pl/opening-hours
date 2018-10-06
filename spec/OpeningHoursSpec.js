define(['jquery', 'moment'], function ($, moment) {
  'use strict';

  describe('openingHours', function () {
    var $defaultDiv;
    beforeEach(function () {
      $defaultDiv = $('<div />', {
        class: 'test'
      });
    });

    describe('current status', function () {
      var defaultConf = {
        show: 'current-status',
        hours: {
          monday: [
            [8.30, 13.30],
            [14.00, 18.30]
          ]
        }
      };
      var expected;
      describe('open', function(){
        beforeEach(function () {
          expected = 'open';
        });
        it("should show open at 12:00 monday", function (done) {
          testByDateAndHtml('08-10-2018 12:00', done);
        });
        it("should show open at 18:20 monday", function (done) {
          testByDateAndHtml('08-10-2018 18:20', done);
        });
        it("should show open at 8:30 monday", function (done) {
          testByDateAndHtml('08-10-2018 8:30', done);
        });
        it("should show open at 18:30 monday", function (done) {
          testByDateAndHtml('08-10-2018 18:30', done);
        });
      });
      describe('closed', function(){
        beforeEach(function () {
          expected = 'closed';
        });
        it("should show closed at 13:40 monday", function (done) {
          testByDateAndHtml('08-10-2018 13:40', done);
        });
        it("should show closed at 8:20 monday", function (done) {
          testByDateAndHtml('08-10-2018 8:20', done);
        });
        it("should show closed at 12:00 sunday", function (done) {
          testByDateAndHtml('07-10-2018 12:00', done);
        });
      });

      function testByDateAndHtml(date, done) {
        window.moment = function () {
          return moment(date, 'DD-MM-YYYY hh:mm')
        };
        registerOpeningHours(function () {
          $defaultDiv.openingHours(defaultConf);
          expect($defaultDiv.html()).toBe(expected);
          done();
        });
      }
    });

    describe('closing in', function () {
      var defaultConf = {
        show: 'closing-in',
        hours: {
          monday: [[8.30, 18.30]]
        }
      };
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
  });

  function registerOpeningHours(callback) {
    require(['opening-hours'], function () {
      callback();
    })
  }
});
