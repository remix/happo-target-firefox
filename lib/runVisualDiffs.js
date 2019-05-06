'use strict';

var fs = require('fs');
var path = require('path');

var _require = require('selenium-webdriver'),
    By = _require.By;

var _require2 = require('pngjs'),
    PNG = _require2.PNG;

var mkdirp = require('mkdirp');

var _require3 = require('happo-core'),
    RunResult = _require3.RunResult,
    getImageFromStream = _require3.getImageFromStream,
    areImagesEqual = _require3.areImagesEqual,
    pathToSnapshot = _require3.pathToSnapshot,
    constructUrl = _require3.constructUrl,
    Constants = _require3.Constants;

function checkForInitializationErrors(driver) {
  return new Promise(function (resolve, reject) {
    driver.executeScript('return window.happo.errors;').then(function (errors) {
      if (errors.length) {
        reject(new Error('JavaScript errors found during initialization:\n' + String(JSON.stringify(errors))));
      } else {
        resolve(driver);
      }
    });
  });
}

function loadTestPage(driver) {
  return new Promise(function (resolve, reject) {
    driver.get(constructUrl('/snapshot')).then(function () {
      return resolve(driver);
    })['catch'](reject);
  });
}

function resolveViewports(example, options) {
  var viewports = example.options.viewports || Object.keys(options.viewports).slice(0, 1);

  return viewports.map(function (viewport) {
    return Object.assign({}, options.viewports[viewport], { name: viewport });
  });
}

function getExamplesByViewport(driver, options) {
  return new Promise(function (resolve, reject) {
    return driver.executeScript('return window.happo.getAllExamples();').then(function (examples) {
      if (!examples.length) {
        reject(new Error('No happo examples found'));
      } else {
        var examplesByViewport = {};
        examples.forEach(function (example) {
          resolveViewports(example, options).forEach(function (viewport) {
            examplesByViewport[viewport.name] = examplesByViewport[viewport.name] || {};

            examplesByViewport[viewport.name].viewport = examplesByViewport[viewport.name].viewport || viewport;

            examplesByViewport[viewport.name].examples = examplesByViewport[viewport.name].examples || [];

            examplesByViewport[viewport.name].examples.push(example);
          });
        });
        resolve({ driver: driver, examplesByViewport: examplesByViewport });
      }
    });
  });
}

function takeCroppedScreenshot(_ref) {
  var driver = _ref.driver;

  return new Promise(function (resolve, reject) {
    driver.findElement(By.id(Constants.SCREENSHOT_BOX_ID)).then(function (overlay) {
      overlay.takeScreenshot().then(function (screenshot) {
        // This is deprecated in Node 6. We will eventually need to change
        // this to:
        //
        //   Buffer.from(screenshot, 'base64')
        var screenshotBuffer = new Buffer(screenshot, 'base64');
        var png = new PNG();
        png.on('parsed', function () {
          function handlePngParsed() {
            resolve(this);
          }

          return handlePngParsed;
        }());
        png.parse(screenshotBuffer);
      })['catch'](reject);
    })['catch'](reject);
  });
}

function compareAndSave(_ref2) {
  var description = _ref2.description,
      viewportName = _ref2.viewportName,
      snapshotImage = _ref2.snapshotImage;

  return new Promise(function (resolve) {
    var previousImagePath = pathToSnapshot({
      description: description,
      viewportName: viewportName,
      fileName: 'previous.png'
    });

    var currentImagePath = pathToSnapshot({
      description: description,
      viewportName: viewportName,
      fileName: 'current.png'
    });

    // This is potentially expensive code that is run in a tight loop
    // for every snapshot that we will be taking. With that in mind,
    // we want to do as little work here as possible to keep runs
    // fast. Therefore, we have landed on the following algorithm:
    //
    // 1. Delete previous.png if it exists.
    // 2. Compare the current snapshot in memory against current.png
    //    if it exists.
    // 3. If there is a diff, move current.png to previous.png
    // 4. If there is no diff, return, leaving the old current.png in
    //    place.
    if (fs.existsSync(previousImagePath)) {
      fs.unlinkSync(previousImagePath);
    }

    if (fs.existsSync(currentImagePath)) {
      getImageFromStream(fs.createReadStream(currentImagePath)).then(function (currentImage) {
        if (areImagesEqual(currentImage, snapshotImage)) {
          resolve({
            result: 'equal'
          });
        } else {
          fs.renameSync(currentImagePath, previousImagePath);

          snapshotImage.pack().pipe(fs.createWriteStream(currentImagePath)).on('finish', function () {
            resolve({
              result: 'diff',
              height: Math.max(snapshotImage.height, currentImage.height)
            });
          });
        }
      });
    } else {
      mkdirp.sync(path.dirname(currentImagePath));
      snapshotImage.pack().pipe(fs.createWriteStream(currentImagePath)).on('finish', function () {
        resolve({
          result: 'new',
          height: snapshotImage.height
        });
      });
    }
  });
}

function renderExamples(_ref3) {
  var driver = _ref3.driver,
      examples = _ref3.examples,
      viewportName = _ref3.viewportName;

  var script = '\n    var callback = arguments[arguments.length - 1];\n    function doneFunc(result) {\n      requestAnimationFrame(function() {\n        callback(result);\n      });\n    };\n    window.happo.renderExample(arguments[0], doneFunc);\n  ';

  var runResult = new RunResult();

  return new Promise(function (resolve, reject) {
    var compareAndSavePromises = [];

    function processNextExample() {
      if (!examples.length) {
        Promise.all(compareAndSavePromises).then(function () {
          process.stdout.write('\n');
          resolve({ driver: driver, runResult: runResult });
        });
        return;
      }

      var _examples$shift = examples.shift(),
          description = _examples$shift.description;

      driver.executeAsyncScript(script, description).then(function (_ref4) {
        var error = _ref4.error,
            width = _ref4.width,
            height = _ref4.height,
            top = _ref4.top,
            left = _ref4.left;

        if (error) {
          reject(new Error('Error rendering "' + String(description) + '":\n  ' + String(error)));
          return undefined;
        }

        return takeCroppedScreenshot({
          driver: driver,
          description: description,
          width: width,
          height: height,
          top: top,
          left: left
        }).then(function (snapshotImage) {
          compareAndSavePromises.push(compareAndSave({ description: description, viewportName: viewportName, snapshotImage: snapshotImage }).then(function (_ref5) {
            var result = _ref5.result,
                resultingHeight = _ref5.height;

            process.stdout.write(result === 'diff' ? '×' : '·');
            runResult.add({
              result: result,
              description: description,
              height: resultingHeight,
              viewportName: viewportName
            });
          }));
          processNextExample();
        });
      });
    }

    processNextExample();
  });
}

function performDiffs(_ref6) {
  var driver = _ref6.driver,
      examplesByViewport = _ref6.examplesByViewport;

  return new Promise(function (resolve, reject) {
    var viewportNames = Object.keys(examplesByViewport);
    var combinedResult = new RunResult();

    function processViewportIter() {
      var viewportName = viewportNames.shift();
      if (!viewportName) {
        // we're out of viewports
        resolve(combinedResult);
        return;
      }
      var _examplesByViewport$v = examplesByViewport[viewportName],
          examples = _examplesByViewport$v.examples,
          _examplesByViewport$v2 = _examplesByViewport$v.viewport,
          width = _examplesByViewport$v2.width,
          height = _examplesByViewport$v2.height;


      driver.manage().window().setSize(width, height).then(function () {
        process.stdout.write(String(viewportName) + ' (' + String(width) + 'x' + String(height) + ') ');
        return renderExamples({ driver: driver, examples: examples, viewportName: viewportName }).then(function (_ref7) {
          var runResult = _ref7.runResult;

          combinedResult.merge(runResult);
        }).then(processViewportIter)['catch'](reject);
      });
    }
    processViewportIter();
  });
}

module.exports = function () {
  function runVisualDiffs(driver, options) {
    if (!driver) {
      throw new Error('driver not successfully loaded');
    }

    return loadTestPage(driver, options).then(checkForInitializationErrors).then(function (d) {
      return getExamplesByViewport(d, options);
    }).then(performDiffs);
  }

  return runVisualDiffs;
}();