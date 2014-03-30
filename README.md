# Nodejs Firewall

[![Build](https://travis-ci.org/plouc/node-firewall.png)](https://travis-ci.org/plouc/node-firewall)
[![Coverage](https://coveralls.io/repos/plouc/node-firewall/badge.png?branch=master)](https://coveralls.io/r/plouc/node-firewall?branch=master)
[![Dependency Status](https://david-dm.org/plouc/node-firewall.png)](https://david-dm.org/plouc/node-firewall)

Unobtrusively handles security based on roles (authorization) plus authentication initialization.

[Documentation](http://node-firewall.readthedocs.org/en/latest/) is available on read the docs.

## Usage

Configuring the firewall.

```javascript
var firewall = require('node-firewall');
    
var fw = new firewall.Firewall('fw.main', '^/');

// allow non authenticated users to access the login page
fw.add('^/login', null);

// secure admin area
fw.add('^/admin', 'admin');

// all other urls require user role
fw.add('^/', 'user');

// add our new firewall to the map
firewall.map.add(fw);

// enable debug (really verbose, should be disabled in production)
firewall.map.debug(true);
```

Enabling the middleware

```javascript
// init firewall middleware
firewall.use(app);
```

## Changelog

* 0.1.2
  - Improve firewall log system
* 0.1.3
  - Fix FirewallMap.get when trying to retrieve a non existent firewall
  - Improve doc blocks
* 0.1.4
  - Improve documentation
  - Add ability to filter firewall rules based on request http method
  - Add Firewall.dump() method
* 0.1.5
  - Add authentication handler
  - Add default handlers to firewall

## Credits

[Raphaël Benitte](http://github.com/plouc)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Raphaël Benitte <[http://rbenitte.com/](http://rbenitte.com/)>
