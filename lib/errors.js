'use strict';
/**
 * Custom error to handle non authenticated users.
 *
 * @param {string} message
 * @constructor
 */
function NotAuthenticatedError(message) {
    this.name    = 'NotAuthenticatedError';
    this.message = (message || '');
}
NotAuthenticatedError.prototype = new Error();
NotAuthenticatedError.prototype.constructor = NotAuthenticatedError;
module.exports.NotAuthenticatedError = NotAuthenticatedError;

/**
 * Custom error to handle access denied.
 *
 * @param {string} message
 * @constructor
 */
function AccessDeniedError(message) {
    this.name    = 'AccessDeniedError';
    this.message = (message || '');
}
AccessDeniedError.prototype = new Error();
AccessDeniedError.prototype.constructor = AccessDeniedError;
module.exports.AccessDeniedError = AccessDeniedError;