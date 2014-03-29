/**
 * Ensure given object is a RegExp object.
 *
 * @param {RegExp|string} pattern
 * @returns {RegExp}
 */
exports.ensureRegexp = function (pattern) {
    if (!pattern instanceof RegExp) {
        pattern = new RegExp(pattern);
    }

    return pattern;
};

/**
 * Check/Ensure given string is a valid http method.
 *
 * @param {string} method
 * @returns {string} normalized http method
 */
exports.ensureValidHttpMethod = function (method) {
    var normMethod = method.toUpperCase();
    var methods    = ['GET', 'POST', 'PUT', 'DELETE'];
    if (methods.indexOf(normMethod) === -1) {
        throw new Error('"' + method + '" is not a valid http method, should be one of ' + methods.join(', '));
    }

    return normMethod;
};

/**
 * Normalize given parameters to form a valid rule.
 *
 * @param {RegExp|string}  path   Regexp used to check if rule should be applied
 * @param {Array.<string>} roles  Authorized roles
 * @param {string|null}    method Rule will only be applied for this http method
 */
exports.normalizeRule = function (path, roles, method) {
    // ensure that given roles is an array or null
    if (Object.prototype.toString.call(roles) !== '[object Array]' && roles !== null) {
        roles = [roles];
    }

    if (method !== undefined && method !== null) {
        method = exports.ensureValidHttpMethod(method);
    } else {
        method = null;
    }

    return {
        path:   exports.ensureRegexp(path),
        roles:  roles,
        method: method
    };
};