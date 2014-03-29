module.exports = function (url, authenticated, roles) {
    return {
        url: url,
        isAuthenticated: function () {
            return authenticated;
        },
        user: {
            role: roles
        }
    }
};