var _        = require('lodash'),
    utils    = require('./utils'),
    strategy = require('./strategy'),
    errors   = require('./errors');
    var debug = require('debug')('node-firewall:firewall');

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
var Firewall = function Firewall(name, path, authenticationHandler, successHandler, failureHandler) {
    this.name      = name;
    this.path      = utils.ensureRegexp(path);
    this.rules     = [];

    // configure handlers
    this.authenticationHandler = authenticationHandler || function (req, res, next) {
        res.status(401);
        return res.redirect('/login');
    };
    this.successHandler = successHandler;
    this.failureHandler = failureHandler || function (req, res, next) {
        return res.send(403, 'forbidden');
    };

    this.logger = debug;

    this.strategies = {
        role: strategy.role
    };
};

/**
 * Add a new strategy factory to the firewall.
 *
 * @param {string}   strategyName
 * @param {function} stategyFn
 * @returns {Firewall}
 * @api public
 */
Firewall.prototype.addStrategy = function (strategyName, stategyFn) {
    this.strategies[strategyName] = stategyFn;

    return this;
};

/**
 * Check if the firewall has the given strategy factory.
 *
 * @param {string} strategyName
 * @returns {boolean}
 * @api public
 */
Firewall.prototype.hasStrategy = function (strategyName) {
    return this.strategies.hasOwnProperty(strategyName);
}

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
 * Log provided arguments, if arguments contain strings,
 * they will be prefixed with '[firewall] FIREWALL_NAME '.
 * Logging is only enabled exporting env variable like DEBUG=node-firewall:firewall
 *
 * @see Firewall.prototype.debug
 * @api private
 */
Firewall.prototype._log = function () {
    if (this.logger) {
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
 *
 * @param {object}   req
 * @param {object}   res
 * @param {function} next
 * @param {bollean} handleNext
 * @returns {null|boolean} Returns 'null' if no rule matched the request,
 *                         'true' for granted access and 'false' if denied
 * @api public
 */
Firewall.prototype.check = function (req, res, next, handleNext) {
    next = next || _.noop;
    handleNext = handleNext || false;
    var ruleCount = this.rules.length;
    var rule, i;

    // use traditional for loop to be able to break it with return
    for (i = 0; i < ruleCount; i++) {
        rule = this.rules[i];
        if (req.url.match(rule.path)) {
            // no specific method defined on rule or method defined and req.method matching
            if (rule.method === '*' || rule.method === req.method) {

                this._log('rule match: ' + rule.path + ' [' + req.method + ' ' + req.url + ']');

                if (rule.strategy) {
                    try {
                        rule.strategy(req);
                    } catch (strategyErr) {
                        if (strategyErr instanceof errors.NotAuthenticatedError) {
                            this._log('denied access (user is not authenticated)');
                            this._handleAuthentication(req, res, next);

                            return false;
                        } else if (strategyErr instanceof errors.AccessDeniedError) {
                            this._log('denied access (user has no allowed role)');
                            this._handleFailure(req, res, next);

                            return false;
                        }
                    }
                }

                this._log('granted access');
                this._handleSuccess(req, res, next);
                return true;
            }
        }
    }

    if (!handleNext) {
        next();
    }
    return null;
};

/**
 * Normalize given parameters to form a valid rule.
 *
 * @param {RegExp|string}  path         Regexp used to check if rule should be applied
 * @param {Array}          strategyConf The strategy configuration
 * @param {string|null}    method       Rule will only be applied for this http method
 * @api private
 */
Firewall.prototype._normalizeRule = function (path, strategyConf, method) {
    var strategy;

    if (strategyConf === null ) {
        strategy = null;
    } else {
        var strategyArgIsArray = Object.prototype.toString.call(strategyConf) === '[object Array]';
        if (!strategyArgIsArray || strategyConf.length < 1) {
            throw new Error('Invalid strategy given, strategy must be passed with the form [\'strategyName\', \'strategyArg0\', [\'strategyArg1\']]');
        }

        if (!this.strategies[strategyConf[0]]) {
            throw new Error('Invalid strategy given, firewall "' + this.name + '" does not know how to build "' + strategyConf[0] + '" strategy');
        }

        var strategyArgs = strategyConf.slice(1);
        strategyArgs.unshift(this);
        strategy = this.strategies[strategyConf[0]].apply(null, strategyArgs);
    }


    if (method !== undefined && method !== null) {
        method = utils.ensureValidHttpMethod(method);
    } else {
        method = '*';
    }

    return {
        path:     utils.ensureRegexp(path),
        strategy: strategy,
        method:   method
    };
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
Firewall.prototype.prepend = function (path, strategy, method) {
    this.rules.unshift(this._normalizeRule(path, strategy, method));

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
Firewall.prototype.append = function (path, strategy, method) {
    this.rules.push(this._normalizeRule(path, strategy, method));

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