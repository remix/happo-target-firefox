'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitForImageToLoad = waitForImageToLoad;
exports['default'] = waitForImagesToRender;

var _findBackgroundImageUrls = require('./findBackgroundImageUrls');

var _findBackgroundImageUrls2 = _interopRequireDefault(_findBackgroundImageUrls);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function waitForImageToLoad(url) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onerror = function () {
      return reject(new Error('Happo: Failed to load image with url ' + String(url)));
    };
    img.addEventListener('load', resolve, { once: true });
    img.src = url;
  });
}

function waitForImagesToRender() {
  return new Promise(function (resolve, reject) {
    var promises = Array.prototype.slice.call(document.querySelectorAll('img')).map(function (img) {
      return img.src;
    }).filter(Boolean).map(waitForImageToLoad);

    Array.prototype.slice.call(document.body.querySelectorAll('*')).forEach(function (element) {
      var computedStyle = window.getComputedStyle(element);
      var urls = (0, _findBackgroundImageUrls2['default'])(computedStyle.getPropertyValue('background-image'));
      promises.push.apply(promises, _toConsumableArray(urls.map(waitForImageToLoad)));
    });

    if (promises.length === 0) {
      // There are no images to wait for, so we can just resolve right away.
      resolve();
    }

    Promise.all(promises).then(function () {
      // Now that the images have loaded, we need to wait for a couple of
      // animation frames to go by before we think they will have finished
      // rendering.
      requestAnimationFrame(function () {
        // Start render
        requestAnimationFrame(function () {
          // Finish rendering
          resolve();
        });
      });
    })['catch'](reject);
  });
}