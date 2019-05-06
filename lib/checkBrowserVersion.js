'use strict';

var childProcess = require('child_process');

var firefox = require('selenium-webdriver/firefox');

var MINIMUM_FIREFOX_VERSION = 50.0;
var FIREFOX_VERSION_MATCHER = /Mozilla Firefox ([0-9.]+)/;

module.exports = function () {
  function checkBrowserVersion() {
    return new Promise(function (resolve, reject) {
      new firefox.Binary().locate().then(function (pathToExecutable) {
        childProcess.exec(String(pathToExecutable) + ' --version', function (error, stdout) {
          if (error) {
            reject(new Error('Failed to check Firefox version: ' + String(error)));
            return;
          }
          var match = stdout.match(FIREFOX_VERSION_MATCHER);
          if (!match) {
            reject(new Error('Failed to parse Firefox version string "' + String(stdout) + '"'));
          } else if (parseFloat(match[1]) < MINIMUM_FIREFOX_VERSION) {
            reject(new Error('Happo requires Firefox version ' + MINIMUM_FIREFOX_VERSION + ' or later. ' + ('You are using ' + String(stdout))));
          } else {
            resolve();
          }
        });
      });
    });
  }

  return checkBrowserVersion;
}();