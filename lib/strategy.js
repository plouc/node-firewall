'use strict';
var errors = require('./errors'),
    _      = require('lodash');

module.exports.role = function (firewall, roles) {
    if (!roles) {
        throw new Error('RoleStrategy requires at least one role defined');
    }

    if (Object.prototype.toString.call(roles) != '[object Array]') {
        roles = [roles];
    }

    var allowedRoles = roles;

    return function (req) {
        if (!req.isAuthenticated()) {
            throw new errors.NotAuthenticatedError();
        } else if (!req.user.role) {
            throw new errors.AccessDeniedError();
        }

        firewall._log('user roles: "' + req.user.role.join('", "') + '"');
        firewall._log('allowed roles: "' + allowedRoles.join('", "') + '"');

        var matchingRoles = _.intersection(req.user.role, allowedRoles);
        if (matchingRoles.length === 0) {
            throw new errors.AccessDeniedError();
        }

        firewall._log('matching roles: "' + matchingRoles.join('", "') + '"');

        return true;
    };
};