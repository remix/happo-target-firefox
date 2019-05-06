'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function HappoDebug() {
  return _react2['default'].createElement(
    'div',
    null,
    _react2['default'].createElement(
      'header',
      { className: 'HappoDebug__header' },
      _react2['default'].createElement(
        'h1',
        { className: 'HappoDebug__headerTitle' },
        'Happo Debug Tool'
      )
    ),
    _react2['default'].createElement(
      'main',
      { className: 'HappoDebug__main' },
      _react2['default'].createElement(
        'p',
        null,
        'Click on an item to render that example in isolation.'
      ),
      _react2['default'].createElement(
        'ul',
        null,
        Object.keys(window.happo.defined).sort().map(function (description) {
          return _react2['default'].createElement(
            'li',
            null,
            _react2['default'].createElement(
              'a',
              { href: '/snapshot?description=' + String(encodeURIComponent(description)) },
              description
            )
          );
        })
      )
    )
  );
}

document.addEventListener('DOMContentLoaded', function () {
  var rootElement = document.getElementById('react-root');
  _reactDom2['default'].render(_react2['default'].createElement(HappoDebug, null), rootElement);
});