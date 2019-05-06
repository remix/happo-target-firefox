"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = findBackgroundImageUrls;
var URL_PATTERN = /(?:url\(['"]?)(.*?)(?:['"]?)\)/g;

function findBackgroundImageUrls(string) {
  var result = [];
  var match = void 0;
  // eslint-disable-next-line no-cond-assign
  while (match = URL_PATTERN.exec(string)) {
    // Inlined images of the form data:image can contain embedded svg.
    // To avoid failing to load this image, we need to unescape escaped single quotes.
    var url = match[1].replace(/\\'/g, "'");
    result.push(url);
  }
  return result;
}