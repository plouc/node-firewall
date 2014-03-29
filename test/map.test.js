var FirewallMap   = require('../lib/map'),
    Firewall      = require('../lib/firewall'),
    requestHelper = require('./requestHelper'),
    expect        = require('chai').expect;

describe('FirewallMap', function () {
    var map = new FirewallMap();


    it('should have an empty set of firewalls initialized', function () {
        expect(map.firewalls).to.be.a('array');
        expect(map.firewalls).to.deep.equal([]);
    });


    it('should provide a way to easily add/retrieve/remove firewalls', function () {
        expect(map.firewalls.length).to.equal(0);

        var testFirewallA = new Firewall('firewall.test.A', /^\/$/);
        map.add(testFirewallA);
        expect(map.firewalls.length).to.equal(1);
        expect(map.get('firewall.test.A')).to.deep.equal(testFirewallA);

        var testFirewallB = new Firewall('firewall.test.B', /^\/$/);
        map.add(testFirewallB);
        expect(map.firewalls.length).to.equal(2);
        expect(map.get('firewall.test.B')).to.deep.equal(testFirewallB);

        map.remove('firewall.test.B');
        expect(map.firewalls.length).to.equal(1);
    });


    it('should throw an error when trying to add a non firewall object', function () {
        expect(function () {
            map.add('invalid');
        }).to.throw('Invalid firewall given');
    });


    it('should only apply on request having its url matching firewall path', function () {
        var granted = null;
        var grantedCb = function () { granted = true; }
        var deniedCb  = function () { granted = false; }

        var fw0 = new Firewall('fw.0', '^/test0');
        fw0.add('^/', null);

        var fw1 = new Firewall('fw.0', '^/test1');
        fw1.add('^/', 'user');

        map.clear().add(fw0).add(fw1);

        map.check(requestHelper('/'), grantedCb, deniedCb);
        expect(granted).to.equal(null); // no match

        map.check(requestHelper('/test0'), grantedCb, deniedCb);
        expect(granted).to.equal(true); // match fw0

        map.check(requestHelper('/test1'), grantedCb, deniedCb);
        expect(granted).to.equal(false); // match fw1
    });


    it('should configure firewalls with a config object', function () {
        map = new FirewallMap();
        map.fromConfig({
            'fw.main': {
                debug: true,
                path:  '^/',
                rules: [
                    [ '^/login', null ],
                    [ '^/', [ 'user', 'admin' ] ],
                    [ '^/admin', [ 'admin' ] ]
                ]
            }
        });

        expect(map.firewalls.length).to.equal(1);
        expect(map.firewalls[0].name).to.equal('fw.main');
        expect(map.firewalls[0].path).to.equal('^/');
        expect(map.firewalls[0].rules.length).to.equal(3);
    });
});