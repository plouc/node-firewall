FirewallMap
===========

A FirewallMap contains **one or more firewalls**, you'll often have a single firewall in your application,
but if you have more specific needs, you have the ability to add another one.

Usage
-----

You can configure a map by using the API.

.. code-block:: javascript

   var FirewallMap = require('node-firewall').FirewallMap,
       Firewall    = require('node-firewall').Firewall;

   var map = new FirewallMap();

   // create a new firewall
   var fw = new Firewall('fw.main', '^/');
   fw.add('^/login', null); // allow unauthenticated access on /login
   fw.add('^/', 'user');    // all other resources require `user` role

   // add it to the map
   map.add(fw);

   // ...

   map.check(req, res, next);

You can also configure the FirewallMap using a plain old javascript object.

.. code-block:: javascript

   var FirewallMap = require('node-firewall').FirewallMap;

   var map = new FirewallMap();
   map.fromConfig({
       'fw.main': {
           path:  '^/',
           rules: [
               [ '^/login', null   ],
               [ '^/',      'user' ]
           ]
       }
   });

   // ...