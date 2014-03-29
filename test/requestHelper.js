module.exports = function (url, authenticated, roles, method) {
    return {
        url:    url,
        method: method || 'GET',
        isAuthenticated: function () {
            return authenticated;
        },
        user: {
            role: roles
        }
    }
};