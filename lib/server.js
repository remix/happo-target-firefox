'use strict';

var path = require('path');

var prepareViewData = require('happo-viewer/lib/prepareViewData');

function isValidResource(file, options) {
  return options.sourceFiles.includes(file) || options.stylesheets.includes(file) || file.startsWith(options.snapshotsFolder);
}

function createApp(options) {
  var express = require('express'); // eslint-disable-line global-require

  var app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, '../views'));
  app.use(express['static'](path.resolve(__dirname, '../public')));
  options.publicDirectories.forEach(function (directory) {
    app.use(express['static'](path.join(process.cwd(), directory)));
  });

  app.get('/snapshot', function (request, response) {
    response.render('snapshot', prepareViewData({
      sourceFiles: options.sourceFiles,
      stylesheets: options.stylesheets,
      debugMode: !!request.query.description
    }));
  });

  app.get('/resource', function (request, response) {
    var file = request.query.file;
    if (file.startsWith('http')) {
      response.redirect(file);
    } else if (isValidResource(file, options)) {
      response.sendFile(file, { root: process.cwd() });
    } else {
      response.sendStatus(403);
    }
  });

  app.get('/debug', function (request, response) {
    response.render('debug', prepareViewData({
      sourceFiles: options.sourceFiles
    }));
  });

  return app;
}

module.exports = {
  start: function () {
    function start(options) {
      return new Promise(function (resolve) {
        var app = createApp(options);
        var expressServer = app.listen(options.port, options.bind, function () {
          console.log('Happo Firefox Target listening on ' + String(options.port));
          resolve({ expressServer: expressServer });
        });
      });
    }

    return start;
  }()
};