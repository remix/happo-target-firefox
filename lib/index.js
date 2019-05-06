'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('happo-core'),
    constructUrl = _require.constructUrl;

var runVisualDiffs = require('./runVisualDiffs');
var initializeWebdriver = require('./initializeWebdriver');
var checkBrowserVersion = require('./checkBrowserVersion');
var server = require('./server');
var defaultOptions = require('./defaultOptions');

var FirefoxTarget = function () {
  function FirefoxTarget(passedOptions) {
    _classCallCheck(this, FirefoxTarget);

    this.options = _extends({}, defaultOptions, passedOptions);
    this.name = this.options.name;
  }

  _createClass(FirefoxTarget, [{
    key: 'debug',
    value: function () {
      function debug() {
        return server.start(this.options).then(function () {
          console.log('=> ' + String(constructUrl('/debug')));
        });
      }

      return debug;
    }()
  }, {
    key: 'run',
    value: function () {
      function run() {
        var _this = this;

        return server.start(this.options).then(checkBrowserVersion).then(function () {
          return initializeWebdriver(_this.options);
        }).then(function (driver) {
          return runVisualDiffs(driver, _this.options).then(function (result) {
            driver.quit();
            return result;
          })['catch'](function (error) {
            driver.quit();
            throw new Error(error);
          });
        });
      }

      return run;
    }()
  }]);

  return FirefoxTarget;
}();

module.exports = FirefoxTarget;