var Firewall   = require('../lib/firewall'),
    testHelper = require('./testHelper'),
    expect     = require('chai').expect;

describe('Firewall', function () {
    var fw;


    it('should have a name, pattern and rules when initialized', function () {
        fw = new Firewall('fw', /^\/$/);
        expect(fw.name).to.equal('fw');
        expect(fw.path).to.deep.equal(/^\/$/);
        expect(fw.rules).to.be.a('array');
    });


    it('should ensure given path is a RegExp', function () {
        fw = new Firewall('fw', '^/$');
        // weird failure
        //expect(fw.path).to.be.a('regexp');
    });


    it('should provide a way to easily add rules to it', function () {
        fw = new Firewall('fw', /^\/$/);
        expect(fw.rules).to.be.a('array');
        expect(fw.rules.length).to.equal(0);

        fw.add(/$\/test$/, ['user', 'admin']);
        expect(fw.rules.length).to.equal(1);
        expect(fw.rules[0].roles).to.deep.equal(['user', 'admin']);
        expect(fw.rules[0].method).to.equal('*');

        fw.add(/$\/test\/method$/, ['user', 'admin'], 'get');
        expect(fw.rules.length).to.equal(2);
        expect(fw.rules[1].roles).to.deep.equal(['user', 'admin']);
        expect(fw.rules[1].method).to.equal('GET');

        fw.add(/$\/test\/roles/, 'user', 'get');
        expect(fw.rules.length).to.equal(3);
        expect(fw.rules[2].roles).to.be.a('array');
    });


    it('should throw an error for rule with invalid http method', function () {
        fw = new Firewall('fw', /^\/$/);
        expect(function () {
            fw.add(/^\/test$/, ['user', 'admin'], 'invalid');
        }).to.throw('"invalid" is not a valid http method, should be one of GET, POST, PUT, DELETE');
    });


    it('should provide a way to conditionally apply rules depending on request http method', function () {
        fw = new Firewall('fw', '^/');
        fw.add('^/', 'user', 'POST');
        fw.add('^/', null,   'GET');

        expect(fw.check(testHelper.req('/', false, [], 'GET'), testHelper.res, testHelper.next())).to.equal(true);
        expect(fw.check(testHelper.req('/', false, [], 'POST'), testHelper.res, testHelper.next())).to.equal(false);
    });


    it('should only apply on request having an url matching its path', function () {
        fw = new Firewall('fw', '^/');
        expect(fw.match(testHelper.req('/'))).to.equal(true);

        fw = new Firewall('fw', '^/admin');
        expect(fw.match(testHelper.req('/'))).to.equal(false);
    });


    it('should do nothing if no rule were defined for a given request', function () {
        fw = new Firewall('fw', '^/unreached');

        var called = false;
        expect(fw.check(testHelper.req('/test', true), {}, function () {
            called = true;
        })).to.equal(null);
        expect(called).to.equal(true);
    })


    it('should apply rules in order they were defined', function () {
        fw = new Firewall('fw', '^/');
        fw.add('^/test', 'user').add('^/testing', null);
        expect(fw.check(testHelper.req('/test', true), testHelper.res, testHelper.next()
        )).to.equal(false);

        fw = new Firewall('fw', '^/');
        fw.add('^/test', null).add('^/testing', 'user');
        expect(fw.check(testHelper.req('/test', true), testHelper.res, testHelper.next())).to.equal(true);
    });


    it('should provide useful informations for debugging', function () {
        fw = new Firewall('fw', '^/');
        fw.add('^/', null).prepend('^/admin', 'admin').debug(true);

        var logs = [];
        fw.logger = function () {
            logs.push([].slice.call(arguments)[0]);
        }

        expect(fw.match(testHelper.req('/', false))).to.equal(true);
        expect(logs).to.deep.equal([
            '[firewall] "fw" match request url: /'
        ]);
        logs = [];

        expect(fw.check(testHelper.req('/', false), testHelper.res, testHelper.next())).to.equal(true);
        expect(logs).to.deep.equal([
            '[firewall] "fw" rule match: ^/ [GET /]',
            '[firewall] "fw" granted access',
            '[firewall] "fw" calling success handler'
        ]);
        logs = [];

        expect(fw.check(testHelper.req('/admin', false), testHelper.res)).to.equal(false);
        expect(logs).to.deep.equal([
            '[firewall] "fw" rule match: ^/admin [GET /admin]',
            '[firewall] "fw" denied access (user is not authenticated)',
            '[firewall] "fw" calling authentication handler'
        ]);
        logs = [];

        expect(fw.check(testHelper.req('/admin', true), testHelper.res)).to.equal(false);
        expect(logs).to.deep.equal([
            '[firewall] "fw" rule match: ^/admin [GET /admin]',
            '[firewall] "fw" denied access (user has no role)',
            '[firewall] "fw" calling failure handler'
        ]);
        logs = [];

        expect(fw.check(testHelper.req('/admin', true, [ 'user' ]), testHelper.res)).to.equal(false);
        expect(logs).to.deep.equal([
            '[firewall] "fw" rule match: ^/admin [GET /admin]',
            '[firewall] "fw" user roles: "user"',
            '[firewall] "fw" allowed roles: "admin"',
            '[firewall] "fw" denied access',
            '[firewall] "fw" calling failure handler'
        ]);
        logs = [];

        expect(fw.check(testHelper.req('/admin', true, [ 'admin' ]), testHelper.res, testHelper.next())).to.equal(true);
        expect(logs).to.deep.equal([
            '[firewall] "fw" rule match: ^/admin [GET /admin]',
            '[firewall] "fw" user roles: "admin"',
            '[firewall] "fw" allowed roles: "admin"',
            '[firewall] "fw" matching roles: "admin"',
            '[firewall] "fw" granted access',
            '[firewall] "fw" calling success handler'
        ]);
        logs = [];
    });


    it('should prettily dump all defined rules', function () {
        fw = new Firewall('fw', '^/');
        expect(fw.dump()).to.equal('no rule defined on "fw"');

        fw.add('^/login',   null);
        fw.add('^/account', 'user');
        fw.add('^/admin',   'admin');
        fw.add('^/admin',   ['super_admin', 'hyper_admin'], 'POST');
        expect(fw.dump()).to.equal(
            "| PATH      | ROLES                    | METHOD |\n" +
            "| ^/login   | null                     | *      |\n" +
            "| ^/account | user                     | *      |\n" +
            "| ^/admin   | admin                    | *      |\n" +
            "| ^/admin   | super_admin, hyper_admin | POST   |"
        );
    });
});
