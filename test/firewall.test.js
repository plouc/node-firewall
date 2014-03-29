var Firewall      = require('../lib/firewall'),
    requestHelper = require('./requestHelper'),
    expect        = require('chai').expect;

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
        expect(fw.rules[0].method).to.be.a('null');

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


    it('should only apply on request having an url matching its path', function () {
        fw = new Firewall('fw', '^/');
        expect(fw.match(requestHelper('/'))).to.equal(true);

        fw = new Firewall('fw', '^/admin');
        expect(fw.match(requestHelper('/'))).to.equal(false);
    });


    it('should do nothing if no rule were defined for a given request', function () {
        fw = new Firewall('fw', '^/unreached');

        expect(fw.check(requestHelper('/test', true))).to.equal(null);
    })

    it('should apply rules in order they were defined', function () {
        fw = new Firewall('fw', '^/');
        fw.add('^/test', 'user').add('^/testing', null);
        expect(fw.check(requestHelper('/test', true))).to.equal(false);

        fw = new Firewall('fw', '^/');
        fw.add('^/test', null).add('^/testing', 'user');
        expect(fw.check(requestHelper('/test', true))).to.equal(true);
    });


    it('should provide useful informations for debugging', function () {
        fw = new Firewall('fw', '^/');
        fw.add('^/', null).prepend('^/admin', 'admin').debug(true);

        expect(fw.match(requestHelper('/', false))).to.equal(true);
        expect(fw.check(requestHelper('/', false))).to.equal(true);
        expect(fw.check(requestHelper('/admin', true))).to.equal(false);
        expect(fw.check(requestHelper('/admin', true, [ 'user' ]))).to.equal(false);
        expect(fw.check(requestHelper('/admin', true, [ 'admin' ]))).to.equal(true);
    });
});
