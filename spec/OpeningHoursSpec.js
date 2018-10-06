define(['jquery', 'moment'], function ($, moment) {
  'use strict';

  describe('openingHours', function () {
    var $defaultDiv;
    var defaultConf;
    var expected;
    beforeEach(function () {
      $defaultDiv = $('<div />', {
        class: 'test'
      });
    });
    describe('other', function () {
      beforeEach(function(){
        defaultConf = {
          show: 'test'
        };
      });
      it('should show error no object', function (done) {
        defaultConf = undefined;
        checkConsoleWarn('options object is undefined!', done);
      });
      it('should show error no hours', function (done) {
        checkConsoleWarn('undefined hours!', done);
      });
      it('should show closed', function (done) {
        defaultConf.hours = [];
        expected = 'closed';
        testByDateAndHtml('08-10-2018 12:00', done);
      });
      describe('hours errors', function(){
        var hours = {};
        beforeEach(function(){
          defaultConf.hours = hours;
        });
        it('should show hours should be array error when decimal provided', function (done) {
          hours.monday = 8.30;
          checkConsoleWarn('hours values should be array!', done);
        });
        it('should show hours should be array error when object provided', function (done) {
          hours.monday = {
            hour: 8.30
          };
          checkConsoleWarn('hours values should be array!', done);
        });

        it('should show element is not array error when int provided', function (done) {
          hours.monday = [
            1,2,3,4
          ];
          checkConsoleWarn('element "1" in weekday "monday" is not an array!', done);
        });
        it('should show wrong length of hours array error', function (done) {
          hours.monday = [
            [12, 16],
            [12, 16, 18]
          ];
          checkConsoleWarn('array of hours for weekday "monday" is not of length 2 (opening and closing hour)', done);
        });

        it('should show invalid time error > 23', function (done) {
          hours.monday = [
            [24.60, 16.10]
          ];
          checkConsoleWarn('invalid time format (hour part > 23) in 24.6', done);
        });
        it('should show invalid time error < 0', function (done) {
          hours.monday = [
            [-2.60, 16.10]
          ];
          checkConsoleWarn('invalid time format (hour part < 0) in -2.6', done);
        });
        it('should show invalid time error  minute > 59', function (done) {
          hours.monday = [
            [12.60, 16.10]
          ];
          checkConsoleWarn('invalid time format (minute part > 59) in 12.6', done);
        });
      });

      it('should show XXXX error when XXXX', function (done) {
        defaultConf = {
          show: 'test',
          hours: {
            monday: [
              1,2,3,4
            ]
          }
        };
        checkConsoleWarn('hours values should be array!', done);
      });
      function checkConsoleWarn(value, done){
        spyOn(console, 'warn').and.callFake(function(consoleWarn){
          expect(consoleWarn).toBe(value);
        });
        expected = 'Error!';
        testByDateAndHtml('08-10-2018 12:00', done);
      }
    });
    describe('current status', function () {
      beforeEach(function () {
        defaultConf = {
          show: 'current-status',
          hours: {
            monday: [
              [8.30, 13.30],
              [14.00, 18.30]
            ]
          }
        };
      });
      describe('open', function () {
        beforeEach(function () {
          expected = 'open';
        });
        it('should show open at 12:00 monday', function (done) {
          testByDateAndHtml('08-10-2018 12:00', done);
        });
        it('should show open at 18:20 monday', function (done) {
          testByDateAndHtml('08-10-2018 18:20', done);
        });
        it('should show open at 8:30 monday', function (done) {
          testByDateAndHtml('08-10-2018 8:30', done);
        });
        it('should show open at 18:30 monday', function (done) {
          testByDateAndHtml('08-10-2018 18:30', done);
        });
      });
      describe('closed', function () {
        beforeEach(function () {
          expected = 'closed';
        });
        it('should show closed at 13:40 monday', function (done) {
          testByDateAndHtml('08-10-2018 13:40', done);
        });
        it('should show closed at 8:20 monday', function (done) {
          testByDateAndHtml('08-10-2018 8:20', done);
        });
        it('should show closed at 12:00 sunday', function (done) {
          testByDateAndHtml('07-10-2018 12:00', done);
        });
      });
    });

    describe('closing in', function () {
      beforeEach(function(){
        defaultConf = {
          show: 'closing-in',
          hours: {
            monday: [[8.30, 18.30]]
          }
        };
      });
      describe('opening in', function(){
        it('should show opening tomorrow', function (done) {
          expected = 'we are opening tomorrow at 8:30';
          testByDateAndHtml('07-10-2018 17:40', done);
        });
        it('should show opening in two days', function (done) {
          expected = 'we are opening in two days at 8:30';
          testByDateAndHtml('06-10-2018 17:40', done);
        });
      });
      describe('closing in', function(){
        it('should show closing in 50 min', function (done) {
          expected = 'we are closing in 50 min. at 18:30';
          testByDateAndHtml('08-10-2018 17:40', done);
        });
        it('should show closing in 9h 50 min', function (done) {
          expected = 'we are closing in 9 h. 50 min. at 18:30';
          testByDateAndHtml('08-10-2018 8:40', done);
        });
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

    function registerOpeningHours(callback) {
      require(['opening-hours'], function () {
        callback();
      })
    }
  });
});
