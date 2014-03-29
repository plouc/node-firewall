var _        = require('lodash'),
    Firewall = require('./firewall');

/**
 * FirewallMap class act as a container for multiple firewalls.
 *
 * @constructor
 */
var FirewallMap = function () {
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
 * @returns {Firewall}
 * @api public
 */
FirewallMap.prototype.get = function (firewallName) {
    var firewall = _.find(this.firewalls, function (fw) {
        return fw.name === firewallName;
    });

    if (firewall === null) {
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
 * @param            req       The request object
 * @param {function} grantedFn Callback used when access is granted
 * @param {function} deniedFn  Callback used when access is denied
 * @api public
 */
FirewallMap.prototype.check = function (req, grantedFn, deniedFn) {
    var cb = deniedFn;
    this.firewalls.forEach(function (firewall) {
        if (firewall.match(req) === true) {
            var granted = firewall.check(req);
            if (granted !== null) {
                cb = granted ? grantedFn : deniedFn;
                cb(firewall);
            }
        }
    });
};

/**
 * expose `FirewallMap`
 */
module.exports = FirewallMap;