var _     = require('lodash'),
    utils = require('./utils');

/**
 * The firewall is a simple container for multiple url based authorization rules.
 *
 * @param {string}        name
 * @param {string|RegExp} path
 * @param {function}      successHandler
 * @param {function}      failureHandler
 * @constructor
 */
var Firewall = function (name, path, successHandler, failureHandler) {
    this.name      = name;
    this.path      = utils.ensureRegexp(path);
    this.rules     = [];
    this.debugMode = false; // debug mode disabled by default

    // configure handlers
    this.successHandler = successHandler;
    this.failureHandler = failureHandler;
};

Firewall.prototype.handleSuccess = function (req, res, next) {
    if (this.successHandler) {
        this.successHandler(req, res, next);
    }
};

Firewall.prototype.handleFailure = function (req, res, next) {
    if (this.failureHandler) {
        this.failureHandler(req, res, next);
    }
};

/**
 *
 * @param req
 * @returns {boolean}
 */
Firewall.prototype.match = function (req) {
    var matches = req.url.match(this.path);

    if (this.debugMode) { console.log('[firewall] "' + this.name + '" match request url: ' + req.url); }

    return matches !== null;
};

/**
 * Enable/disable debug.
 *
 * @param {boolean} flag
 */
Firewall.prototype.debug = function (flag) {
    this.debugMode = !!flag;
};

/**
 * Iterates over each rules to find one matching given request.
 * Returns:
 *   + null  -> no match
 *   + true  -> access granted
 *   + false -> access denied
 *
 * @param {object} req
 * @returns {null|boolean}
 */
Firewall.prototype.check = function (req) {
    var ruleCount = this.rules.length;
    var rule, i;

    // use traditional for loop to be able to break it with return
    for (i = 0; i < ruleCount; i++) {
        rule = this.rules[i];
        if (req.url.match(rule.path)) {
            if (this.debugMode) { console.log('[firewall] "' + this.name + '" rule match: ' + rule.path + ' [' + req.method + ' ' + req.url + ']'); }
            if (rule.roles === null) {
                if (this.debugMode) { console.log('[firewall] "' + this.name + '" granted access'); }

                return true;
            } else if (!req.isAuthenticated() || !req.user.role) {
                if (this.debugMode) { console.log('[firewall] "' + this.name + '" denied access'); }

                return false;
            } else {
                if (this.debugMode) {
                    console.log('[firewall] "' + this.name + '" user roles: "' + req.user.role.join('", "') + '"');
                    console.log('[firewall] "' + this.name + '" allowed roles: "' + rule.roles.join('", "') + '"');
                }

                var matchingRoles = _.intersection(req.user.role, rule.roles);
                if (matchingRoles.length > 0) {
                    if (this.debugMode) {
                        console.log('[firewall] "' + this.name + '" matching roles: "' + matchingRoles.join('", "') + '"');
                        console.log('[firewall] "' + this.name + '" granted access');
                    }

                    return true;
                }

                if (this.debugMode) { console.log('[firewall] "' + this.name + '" denied access'); }

                return false;
            }
        }
    }

    return null;
};

/**
 * Prepend a new rule.
 *
 * @param {RegExp|string}  path   Regexp used to check if rule should be applied
 * @param {Array.<string>} roles  Authorized roles
 * @param {string|null}    method Rule will only be applied for this http method
 */
Firewall.prototype.prepend = function (path, roles, method) {
    this.rules.unshift(utils.normalizeRule(path, roles, method));
};

/**
 * Append a new rule
 *
 * @param {RegExp|string}  path   Regexp used to check if rule should be applied
 * @param {Array.<string>} roles  Authorized roles
 * @param {string|null}    method Rule will only be applied for this http method
 */
Firewall.prototype.append = function (path, roles, method) {
    this.rules.push(utils.normalizeRule(path, roles, method));
};

/**
 * @see Firewall.prototype.append
 */
Firewall.prototype.add = Firewall.prototype.append;

/**
 * expose `Firewall`
 */
module.exports = Firewall;