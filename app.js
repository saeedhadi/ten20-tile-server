var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var tilelive = require('tilelive');
require('tilelive-mapnik').registerProtocols(tilelive);
require('mbtiles').registerProtocols(tilelive);

var argv = require('optimist')
    .usage('Usage: $0 --url [mapnik xml url] --port [port]')
    .alias('u', 'url')
    .alias('p',  'port')
    .demand(['u'])
    .default('p', process.env.PORT || 7777)
    .argv;

tilelive.load(argv.url, function(err, source) {

    try {
        // all environments
        if (err) {
            throw err;
        }
        var port = parseInt(argv.port, 10);
        app.set('port', port);
        app.use(express.logger('dev'));
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(express.methodOverride());
        app.use(app.router);

        if ('development' == app.get('env')) {
            app.use(express.errorHandler());
        }

        app.get(/^\/v2\/tiles\/(\d+)\/(\d+)\/(\d+).png$/, function(req, res){

            var z = req.params[0];
            var x = req.params[1];
            var y = req.params[2];

            source.getTile(z, x, y, function(err, tile, headers) {
                for (header in headers) {
                    if (!headers.hasOwnProperty(header)) {
                        //The current property is not a direct property of p
                        continue;
                    }
                    res.setHeader(header, headers[header]);
                }
                res.send(tile);
            });
        });

        http.createServer(app).listen(app.get('port'), function() {
            console.log('Express server listening on port ' + app.get('port'));
        });
    } catch(e) {
        console.log(e);
        throw e;
    }
});
