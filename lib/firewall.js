var _     = require('lodash'),
    utils = require('./utils');

/**
 * The firewall is a simple container for multiple url based authorization rules.
 *
 * @param {string}        name                  The firewall name
 * @param {string|RegExp} path                  The firewall will only apply on request url matching this value
 * @param {function|null} authenticationHandler Function to call when login is required
 * @param {function|null} successHandler        Function to call when access is granted
 * @param {function|null} failureHandler        Function to call when access is denied
 * @constructor
 */
var Firewall = function (name, path, authenticationHandler, successHandler, failureHandler) {
    this.name      = name;
    this.path      = utils.ensureRegexp(path);
    this.rules     = [];
    this.debugMode = false; // debug mode disabled by default

    // configure handlers
    this.authenticationHandler = authenticationHandler || function (req, res, next) {
        res.status(401);
        return res.redirect('/login');
    };
    this.successHandler = successHandler || function (req, res, next) {
        next();
    };
    this.failureHandler = failureHandler || function (req, res, next) {
        return res.send(403, 'forbidden');
    };

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
        this._log('calling success handler');
        this.successHandler(req, res, next);
    } else {
        this._log('no success handler');
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
        this._log('calling failure handler');
        this.failureHandler(req, res, next);
    } else {
        this._log('no failure handler');
    }
};

/**
 *
 * @param {object}   req
 * @param {object}   res
 * @param {function} next
 * @private
 */
Firewall.prototype._handleAuthentication = function (req, res, next) {
    if (this.authenticationHandler) {
        this._log('calling authentication handler')
        this.authenticationHandler(req, res, next);
    } else {
        this._log('no authentication handler')
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
 * @param {object}   req
 * @param {object}   res
 * @param {function} next
 * @returns {null|boolean}
 * @api public
 */
Firewall.prototype.check = function (req, res, next) {
    var ruleCount = this.rules.length;
    var rule, i;

    // use traditional for loop to be able to break it with return
    for (i = 0; i < ruleCount; i++) {
        rule = this.rules[i];
        if (req.url.match(rule.path)) {
            // no specific method defined on rule or method defined and req.method matching
            if (rule.method === '*' || rule.method === req.method) {

                this._log('rule match: ' + rule.path + ' [' + req.method + ' ' + req.url + ']');

                if (rule.roles === null) {
                    this._log('granted access');
                    this._handleSuccess(req, res, next);

                    return true;
                } else if (!req.isAuthenticated()) {
                    this._log('denied access (user is not authenticated)');
                    this._handleAuthentication(req, res, next);

                    return false;
                } else if (!req.user.role) {
                    this._log('denied access (user has no role)');
                    this._handleFailure(req, res, next);

                    return false;
                }

                this._log('user roles: "' + req.user.role.join('", "') + '"');
                this._log('allowed roles: "' + rule.roles.join('", "') + '"');

                var matchingRoles = _.intersection(req.user.role, rule.roles);
                if (matchingRoles.length > 0) {
                    this._log('matching roles: "' + matchingRoles.join('", "') + '"');
                    this._log('granted access');
                    this._handleSuccess(req, res, next);

                    return true;
                }

                this._log('denied access');
                this._handleFailure(req, res, next);

                return false;
            }
        }
    }

    next();

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
 * Dump all firewall rules, useful for debugging.
 *
 * @returns {string}
 * @api public
 */
Firewall.prototype.dump = function () {
    if (this.rules.length === 0) {
        return 'no rule defined on "' + this.name + '"';
    }

    var rules = [].slice.call(this.rules);
    rules.unshift({
        path:   'PATH',
        roles:  ['ROLES'],
        method: 'METHOD'
    });

    var maxPathLen = 0, maxRolesLen = 0, maxMethodLen = 0;
    var pathLen, rolesLen, methodLen;

    // compute max lengths
    rules.forEach(function (rule) {
        pathLen = rule.path.toString().length;
        if (pathLen > maxPathLen) {
            maxPathLen = pathLen;
        }

        if (rule.roles === null) {
            rolesLen = 4;
        } else {
            rolesLen = rule.roles.join(', ').length;
        }
        if (rolesLen > maxRolesLen) {
            maxRolesLen = rolesLen;
        }

        methodLen = rule.method.length;
        if (methodLen > maxMethodLen) {
            maxMethodLen = methodLen;
        }
    });

    var out = [];
    rules.forEach(function (rule) {
        var roles = rule.roles === null ? 'null' : rule.roles.join(', ');
        out.push(
            '| ' + rule.path.toString() + utils.repeatStr(' ', maxPathLen - rule.path.toString().length)
            + ' | ' + roles + utils.repeatStr(' ', maxRolesLen - roles.length)
            + ' | ' + rule.method + utils.repeatStr(' ', maxMethodLen - rule.method.length) + ' |'
        )
    });

    return out.join("\n");
};

/**
 * expose `Firewall`
 */
module.exports = Firewall;