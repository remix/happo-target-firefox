'use strict';

require('geckodriver');

var seleniumWebdriver = require('selenium-webdriver');

module.exports = function () {
  function initializeWebdriver(options) {
    return new Promise(function (resolve, reject) {
      try {
        var driver = new seleniumWebdriver.Builder().forBrowser('firefox').build();
        driver.manage().timeouts().setScriptTimeout(options.scriptTimeout);
        resolve(driver);
      } catch (error) {
        reject(error);
      }
    });
  }

  return initializeWebdriver;
}();