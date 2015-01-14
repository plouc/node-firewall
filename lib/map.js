'use strict';
var _        = require('lodash');
var Firewall = require('./firewall');
var strategy = require('./strategy');
var debug = require('debug')('node-firewall:map');
/**
 * FirewallMap class act as a container for multiple firewalls.
 *
 * @constructor
 */
var FirewallMap = function FirewallMap() {
    this.firewalls = [];

    // we must be able to configure strategy factories from the map
    // for the FirewallMap.fromConfig() function.
    this.strategies = {
        role: strategy.role
    };
};

/**
 * Add a new strategy factory to the map.
 *
 * @param {string}   strategyName
 * @param {function} stategyFn
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.addStrategy = function(strategyName, stategyFn) {
    this.strategies[strategyName] = stategyFn;

    return this;
};

/**
 * Creates firewall based on given config object.
 *
 * @param {object} config
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.fromConfig = function(config) {
    for (var firewallName in config) {
        var firewallConfig = config[firewallName];

        var firewall = new Firewall(firewallName, firewallConfig.path);

        _.forOwn(this.strategies, function(strategyFactory, strategyName) {
            if (!firewall.hasStrategy(strategyName)) {
                firewall.addStrategy(strategyName, strategyFactory);
            }
        });

        firewallConfig.rules.forEach(function(rule) {
            firewall.add.apply(firewall, rule);
        });

        this.firewalls.push(firewall);
    }

    return this;
};

/**
 * Clear all previously declared firewalls.
 *
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.clear = function() {
    this.firewalls = [];

    return this;
};

/**
 * Adds a firewall to the map.
 *
 * @param {Firewall} firewall
 * @throws Will throw an error if the given argument is note a Firewall.
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.add = function(firewall) {
    if (firewall instanceof Firewall === false) {
        throw new Error('Invalid firewall given');
    }
    this.firewalls.push(firewall);

    return this;
};

/**
 * Retrieve a firewall by its name.
 *
 * @param {string} firewallName
 * @throws Will throw an error if there is no firewall matching the name.
 * @returns {Firewall}
 * @api public
 */
FirewallMap.prototype.get = function(firewallName) {
    var firewall = _.find(this.firewalls, function(fw) {
        return fw.name === firewallName;
    });

    if (firewall === undefined) {
        throw new Error('Unable to find a firewall by name "' + firewallName + '"');
    }

    return firewall;
};

'use strict';
/**
 * Retrieve all firewall
 *
 * @returns {Firewall array}
 * @api public
 */
FirewallMap.prototype.getAll = function() {
    return this.firewalls;
};

/**
 * Remove a firewall by name.
 *
 * @param {string} firewallName
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.remove = function(firewallName) {
    this.firewalls = _.remove(this.firewalls, function(fw) {
        return fw.name === firewallName;
    });

    return this;
};

/**
 * (DEPRRECATED) Enable/disable debug.
 *
 * @param {boolean} flag
 * @api public
 */
FirewallMap.prototype.debug = function(flag) {
    console.warn('DEPRECATED, node-firewall use debug package on namespace node-firewall:map');
    // only for compat
    process.env.DEBUG = 'node-firewall:map';
};

/**
 * Iterates through all registered firewalls.
 *
 * @param {object}   req  The request object
 * @param {object}   res  The response object
 * @param {function} next Passthru function
 * @api public
 */
FirewallMap.prototype.check = function(req, res, next) {
    next = next || _.noop;
    var firewallsCount = this.firewalls.length;
    var i;
    var callbackDone = false;
    // this function protect for calling next() twice if multiple map is avalaible
    var callback = function() {
        if (callbackDone) {
            return;
        }
        debug('calling next');
        next();
    };
     // use traditional for loop to be able to break it with return
    for (i = 0; i < firewallsCount; i++) {
        var firewall = this.firewalls[i];
        if (firewall.match(req) === true) {
            var checkResult = firewall.check(req, res, callback, true);
            // we find something
            if (checkResult === true) {
                // safe try calling next if no success handler are configured
                return callback();
            }
            if (checkResult === false) {
                // failure or aunthentification handler has been called
                return checkResult;
            }
        }
    }

    // nothing to do, continue
    debug('nothing to do, continue');
    callback();
};

/**
 * expose `FirewallMap`
 */
module.exports = FirewallMap;
