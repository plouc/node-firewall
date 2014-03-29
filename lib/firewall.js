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

    this.logger = console.log;
};

/**
 * @param {object}   req
 * @param {object}   res
 * @param {function} next
 * @api private
 */
Firewall.prototype._handleSuccess = function (req, res, next) {
    if (this.successHandler) {
        this.successHandler(req, res, next);
    }
};

/**
 * @param {object}   req
 * @param {object}   res
 * @param {function} next
 * @api private
 */
Firewall.prototype._handleFailure = function (req, res, next) {
    if (this.failureHandler) {
        this.failureHandler(req, res, next);
    }
};

/**
 * Enable/disable debug.
 *
 * @param {boolean} flag
 * @api public
 */
Firewall.prototype.debug = function (flag) {
    this.debugMode = !!flag;
};

/**
 * Log provided arguments, if arguments contain strings,
 * they will be prefixed with '[firewall] FIREWALL_NAME '.
 * Logging is only enabled if debugMode is true.
 *
 * @see Firewall.prototype.debug
 * @api private
 */
Firewall.prototype._log = function () {
    if (this.logger && this.debugMode === true) {
        var args = [].slice.call(arguments);

        // prefix string arguments with firewall name
        _.forOwn(args, function (arg, index) {
            if (toString.call(arg) == '[object String]') {
                args[index] = '[firewall] "' + this.name + '" ' + arg;
            }
        }.bind(this));

        this.logger.apply(this.logger, args);
    }
};

/**
 * Check if the given request url match this firewall.
 *
 * @param req
 * @returns {boolean}
 * @api public
 */
Firewall.prototype.match = function (req) {
    var matches = req.url.match(this.path);
    if (matches !== null) {
        this._log('match request url: ' + req.url);

        return true;
    }

    return false;
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
 * @api public
 */
Firewall.prototype.check = function (req) {
    var ruleCount = this.rules.length;
    var rule, i;

    // use traditional for loop to be able to break it with return
    for (i = 0; i < ruleCount; i++) {
        rule = this.rules[i];
        if (req.url.match(rule.path)) {
            this._log('rule match: ' + rule.path + ' [' + req.method + ' ' + req.url + ']');
            if (rule.roles === null) {
                this._log('granted access');

                return true;
            } else if (!req.isAuthenticated() || !req.user.role) {
                this._log('denied access');

                return false;
            } else {
                this._log('user roles: "' + req.user.role.join('", "') + '"');
                this._log('allowed roles: "' + rule.roles.join('", "') + '"');

                var matchingRoles = _.intersection(req.user.role, rule.roles);
                if (matchingRoles.length > 0) {
                    this._log('matching roles: "' + matchingRoles.join('", "') + '"');
                    this._log('granted access');

                    return true;
                }

                this._log('denied access');

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
 *
 * @returns {Firewall}
 */
Firewall.prototype.prepend = function (path, roles, method) {
    this.rules.unshift(utils.normalizeRule(path, roles, method));

    return this;
};

/**
 * Append a new rule.
 *
 * @param {RegExp|string}  path   Regexp used to check if rule should be applied
 * @param {Array.<string>} roles  Authorized roles
 * @param {string|null}    method Rule will only be applied for this http method
 * @returns {Firewall}
 * @api public
 */
Firewall.prototype.append = function (path, roles, method) {
    this.rules.push(utils.normalizeRule(path, roles, method));

    return this;
};

/**
 * Alias for append.
 *
 * @see Firewall.prototype.append
 * @api public
 */
Firewall.prototype.add = Firewall.prototype.append;

/**
 * expose `Firewall`
 */
module.exports = Firewall;