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
}

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
}