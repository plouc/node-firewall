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
exports.httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
exports.ensureValidHttpMethod = function (method) {
    var normMethod = method.toUpperCase();
    if (exports.httpMethods.indexOf(normMethod) === -1) {
        throw new Error('"' + method + '" is not a valid http method, should be one of ' + exports.httpMethods.join(', '));
    }

    return normMethod;
};

/**
 * Repeat the given string n times.
 *
 * @param {string} str
 * @param {number} times
 * @returns {string}
 */
exports.repeatStr = function (str, times) {
    return (new Array(times + 1)).join(' ');
};