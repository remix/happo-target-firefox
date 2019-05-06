'use strict';

var _Constants = require('happo-core/lib/Constants');

var _Constants2 = _interopRequireDefault(_Constants);

var _getFullRect2 = require('./getFullRect');

var _getFullRect3 = _interopRequireDefault(_getFullRect2);

var _waitForImagesToRender = require('./waitForImagesToRender');

var _waitForImagesToRender2 = _interopRequireDefault(_waitForImagesToRender);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function handleError(currentExample, error) {
  console.error(error.stack); // eslint-disable-line no-console
  return {
    description: currentExample.description,
    error: error.message
  };
}

/**
 * @param {Function} func The happo.describe function from the current
 *   example being rendered. This function takes a callback as an argument
 *   that is called when it is done.
 * @return {Promise}
 */
function tryAsync(func) {
  var timeoutDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;

  return new Promise(function (resolve, reject) {
    // Safety valve: if the function does not finish after the timeoutDuration,
    // then something probably went haywire and we need to move on.
    var timeout = setTimeout(function () {
      reject(new Error('Async callback was not invoked within timeout.'));
    }, timeoutDuration);

    // This function is called by the example when it is done executing.
    var doneCallback = function doneCallback() {
      clearTimeout(timeout);
      resolve();
    };

    func(doneCallback);
  });
}

window.happo = {
  defined: {},
  fdefined: [],
  errors: [],

  define: function () {
    function define(description, func, options) {
      // Make sure we don't have a duplicate description
      if (this.defined[description]) {
        throw new Error('Error while defining "' + String(description) + '": Duplicate description detected');
      }
      this.defined[description] = {
        description: description,
        func: func,
        options: options || {}
      };
    }

    return define;
  }(),
  fdefine: function () {
    function fdefine(description, func, options) {
      this.define(description, func, options); // add the example
      this.fdefined.push(description);
    }

    return fdefine;
  }(),


  /**
   * @return {Array.<Object>}
   */
  getAllExamples: function () {
    function getAllExamples() {
      var _this = this;

      var descriptions = this.fdefined.length ? this.fdefined : Object.keys(this.defined);

      return descriptions.map(function (description) {
        var example = _this.defined[description];
        // We return a subset of the properties of an example (only those relevant
        // for happo_runner.rb).
        return {
          description: example.description,
          options: example.options
        };
      });
    }

    return getAllExamples;
  }(),


  /**
   * Clean up the DOM for a rendered element that has already been processed.
   * This can be overridden by consumers to define their own clean out method,
   * which can allow for this to be used to unmount React components, for
   * example.
   */
  cleanOutElement: function () {
    function cleanOutElement() {}

    return cleanOutElement;
  }(),


  /**
   * This function is called asynchronously. Therefore, we need to call doneFunc
   * when the method has completed so that Happo knows to continue.
   *
   * @param {String} exampleDescription
   * @param {Function} doneFunc injected by driver.execute_async_script in
   *   happo/runner.rb
   */
  renderExample: function () {
    function renderExample(exampleDescription, doneFunc) {
      var _this2 = this;

      console.log(exampleDescription);
      var currentExample = this.defined[exampleDescription];

      try {
        if (!currentExample) {
          throw new Error('No example found with description "' + String(exampleDescription) + '"');
        }

        // Clear out the body of the document
        while (document.body.firstChild) {
          if (document.body.firstChild instanceof Element) {
            this.cleanOutElement(document.body.firstChild);
          }
          document.body.removeChild(document.body.firstChild);
        }

        var func = currentExample.func,
            options = currentExample.options;

        if (func.length) {
          // The function takes an argument, which is a callback that is called
          // once it is done executing. This can be used to write functions that
          // have asynchronous code in them.
          tryAsync(func, options.timeout).then(function () {
            _this2.processExample(currentExample).then(doneFunc)['catch'](doneFunc);
          })['catch'](function (error) {
            doneFunc(handleError(currentExample, error));
          });
        } else {
          // The function does not take an argument, so we can run it
          // synchronously.
          var result = func();

          if (result instanceof Promise) {
            // The function returned a promise, so we need to wait for it to
            // resolve before proceeding.
            result.then(function () {
              _this2.processExample(currentExample).then(doneFunc)['catch'](doneFunc);
            })['catch'](function (error) {
              doneFunc(handleError(currentExample, error));
            });
          } else {
            // The function did not return a promise, so we assume it gave us an
            // element that we can process immediately.
            this.processExample(currentExample).then(doneFunc)['catch'](doneFunc);
          }
        }
      } catch (error) {
        doneFunc(handleError(currentExample, error));
      }
    }

    return renderExample;
  }(),


  /**
   * Gets the DOM elements that we will use as source for the snapshot. The
   * default version simply gets the direct children of document.body, but you
   * can override this method to better control the root nodes.
   *
   * @return {Array|NodeList}
   */
  getRootNodes: function () {
    function getRootNodes() {
      return document.body.children;
    }

    return getRootNodes;
  }(),


  /**
   * @return {Promise}
   */
  processExample: function () {
    function processExample(currentExample) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        (0, _waitForImagesToRender2['default'])().then(function () {
          try {
            var rootNodes = _this3.getRootNodes();

            var _getFullRect = (0, _getFullRect3['default'])(rootNodes),
                height = _getFullRect.height,
                left = _getFullRect.left,
                top = _getFullRect.top,
                width = _getFullRect.width;

            // We place an (invisible) box on top of the visible rectangle. We
            // then use it as the screenshot target.


            var screenshotBox = document.createElement('div');
            screenshotBox.style.position = 'absolute';
            screenshotBox.style.left = String(left) + 'px';
            screenshotBox.style.top = String(top) + 'px';
            screenshotBox.style.width = String(width) + 'px';
            screenshotBox.style.height = String(height) + 'px';
            screenshotBox.setAttribute('id', _Constants2['default'].SCREENSHOT_BOX_ID);
            document.body.appendChild(screenshotBox);

            resolve({
              description: currentExample.description,
              height: height,
              left: left,
              top: top,
              width: width
            });
          } catch (error) {
            reject(handleError(currentExample, error));
          }
        })['catch'](function (error) {
          reject(handleError(currentExample, error));
        });
      });
    }

    return processExample;
  }()
};

window.addEventListener('load', function () {
  var matches = window.location.search.match(/description=([^&]*)/);
  if (!matches) {
    return;
  }
  var example = decodeURIComponent(matches[1]);
  window.happo.renderExample(example, function () {});
  document.title = String(example) + ' \xB7 Happo';
});

// We need to redefine a few global functions that halt execution. Without this,
// there's a chance that the we can't communicate with the browser.
window.alert = function (message) {
  console.log('`window.alert` called', message); // eslint-disable-line
};

window.confirm = function (message) {
  console.log('`window.confirm` called', message); // eslint-disable-line
  return true;
};

window.prompt = function (message, value) {
  console.log('`window.prompt` called', message, value); // eslint-disable-line
  return null;
};

window.onerror = function (message, url, lineNumber) {
  window.happo.errors.push({
    message: message,
    url: url,
    lineNumber: lineNumber
  });
};