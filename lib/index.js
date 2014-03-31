'use strict';

var Firewall    = require('./firewall'),
    FirewallMap = require('./map'),
    errors      = require('./errors');


/**
 * expose `FirewallMap`
 */
module.exports.Map = FirewallMap;


/**
 * expose `Firewall`
 */
module.exports.Firewall = Firewall;


/**
 * expose custom errors
 */
module.exports.NotAuthenticatedError = errors.NotAuthenticatedError;
module.exports.AccessDeniedError     = errors.AccessDeniedError;


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
        map.check(req, res, next);
    });
};