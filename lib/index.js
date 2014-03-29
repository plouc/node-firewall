'use strict';

var Firewall    = require('./firewall'),
    FirewallMap = require('./map');


/**
 * expose `FirewallMap`
 */
module.exports.Map = FirewallMap;


/**
 * expose `Firewall`
 */
module.exports.Firewall = Firewall;


/**
 * Creates a default map used for middleware.
 */
var map = new FirewallMap();
module.exports.map = map;


/**
 * Firewall as a middleware.
 *
 * @param app The main application object
 */
module.exports.use = function (app) {
    app.use(function (req, res, next) {
        map.check(req, function (firewall) {
            firewall._handleSuccess(req, res, next);
        }, function (firewall) {
            firewall._handleFailure(req, res, next);
        });
    });
};