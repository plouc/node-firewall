module.exports.req = function (url, authenticated, roles, method) {
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

var Response = function () {

};
Response.prototype = {
    status: function (status) {

    },
    redirect: function (url) {

    },
    send: function (data) {

    }
};
module.exports.res = new Response();

module.exports.next = function () {
    return function () {

    };
};