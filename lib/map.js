var _        = require('lodash'),
    Firewall = require('./firewall');

/**
 * FirewallMap class act as a container for multiple firewalls.
 *
 * @constructor
 */
var FirewallMap = function FirewallMap() {
    this.firewalls = [];
    this.debugMode = false; // debug mode disabled by default
};

/**
 * Creates firewall based on given config object.
 *
 * @param {object} config
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.fromConfig = function (config) {
    for (var firewallName in config) {
        var firewallConfig = config[firewallName];

        var firewall = new Firewall(firewallName, firewallConfig.path);
        firewall.debug(firewallConfig.debug);

        firewallConfig.rules.forEach(function (rule) {
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
FirewallMap.prototype.clear = function () {
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
FirewallMap.prototype.add = function (firewall) {
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
FirewallMap.prototype.get = function (firewallName) {
    var firewall = _.find(this.firewalls, function (fw) {
        return fw.name === firewallName;
    });

    if (firewall === undefined) {
        throw new Error('Unable to find a firewall by name "' + firewallName + '"');
    }

    return firewall;
};

/**
 * Remove a firewall by name.
 *
 * @param {string} firewallName
 * @returns {FirewallMap}
 * @api public
 */
FirewallMap.prototype.remove = function (firewallName) {
    this.firewalls = _.remove(this.firewalls, function (fw) {
        return fw.name === firewallName;
    });

    return this;
};

/**
 * Enable/disable debug.
 *
 * @param {boolean} flag
 * @api public
 */
FirewallMap.prototype.debug = function (flag) {
    this.debugMode = !!flag;
    this.firewalls.forEach(function (firewall) {
        firewall.debug(this.debugMode);
    }.bind(this));
};

/**
 * Iterates through all registered firewalls.
 *
 * @param {object}   req  The request object
 * @param {object}   res  The response object
 * @param {function} next Passthru function
 * @api public
 */
FirewallMap.prototype.check = function (req, res, next) {
    this.firewalls.forEach(function (firewall) {
        if (firewall.match(req) === true) {
            firewall.check(req, res, next);
        }
    });
};

/**
 * expose `FirewallMap`
 */
module.exports = FirewallMap;