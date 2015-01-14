var FirewallMap = require('../lib/map'),
    Firewall    = require('../lib/firewall'),
    testHelper  = require('./testHelper'),
    expect      = require('chai').expect;

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


    it('should throw an error when trying to get a non-existent firewall', function () {
        expect(function () {
            map.get('invalid');
        }).to.throw('Unable to find a firewall by name "invalid"');
    });


    it('should only apply on request having its url matching firewall path', function () {
        var granted = null;
        var authCb    = function () { granted = 'auth'; }
        var grantedCb = function () { granted = true;   }
        var deniedCb  = function () { granted = false;  }

        var fw0 = new Firewall('fw.0', '^/test0', authCb, grantedCb, deniedCb);
        fw0.add('^/', null);

        var fw1 = new Firewall('fw.0', '^/test1', authCb, grantedCb, deniedCb);
        fw1.add('^/', ['role', 'user']);

        map.clear().add(fw0).add(fw1);

        map.check(testHelper.req('/'));
        expect(granted).to.equal(null); // no match

        map.check(testHelper.req('/test0'));
        expect(granted).to.equal(true); // match fw0

        map.check(testHelper.req('/test1'));
        expect(granted).to.equal('auth'); // match fw1

        map.check(testHelper.req('/test1', true, ['user.partial']));
        expect(granted).to.equal(false); // match fw1
    });


    it('should configure firewalls with a config object', function () {
        map.clear().fromConfig({
            'fw.main': {
                path:  '^/',
                rules: [
                    ['^/login', null],
                    ['^/', ['role', ['user', 'admin']]],
                    ['^/admin', ['role', 'admin']]
                ]
            }
        });

        expect(map.firewalls.length).to.equal(1);
        expect(map.firewalls[0].name).to.equal('fw.main');
        expect(map.firewalls[0].path).to.equal('^/');
        expect(map.firewalls[0].rules.length).to.equal(3);
    });


    it('should throw an error when trying to configure firewall with a non-existing strategy', function () {
        map.clear();

        expect(function () {
             map.fromConfig({
                 'fw.main': {
                     path:  '^/',
                     rules: [ ['^/', ['custom']] ]
                 }
             });
        }).to.throw('Invalid strategy given, firewall "fw.main" does not know how to build "custom" strategy');
    });


    it('should provide a way to configure firewalls with non-default strategy', function () {
        map.clear();
        map.addStrategy('custom', function () { });
        expect(function () {
            map.fromConfig({
                'fw.main': {
                    path:  '^/',
                    rules: [ ['^/', ['custom']] ]
                }
            });
        }).not.to.throw('Invalid strategy given, firewall "fw.main" does not know how to build "invalid" strategy');
    });
});