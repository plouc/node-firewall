# Nodejs Firewall

[![Build](https://travis-ci.org/plouc/node-firewall.png)](https://travis-ci.org/plouc/node-firewall)
[![Coverage](https://coveralls.io/repos/plouc/node-firewall/badge.png)](https://coveralls.io/r/plouc/node-firewall)

Unobtrusively handles security based on roles (authorization) plus authentication initialization.

## Usage

```javascript

var firewall = require('node-firewall');
    
var fw = new firewall.Firewall('fw.main', '^/', function (req, res, next) {
    next(); // access granted
}, function (req, res, next) {
    // access denied
    res.status(401);
    return res.send({ status : 401 });
});

// allow non authenticated users to access the login page
fw.add('^/login', null);

// secure admin area
fw.add('^/admin', 'admin');

// all other urls require user role
fw.add('^/', 'user');

// add our new firewall to the map
firewall.map.add(fw);

// enable debug (it's quite verbose, should be disabled in production)
firewall.map.debug(true);
```
