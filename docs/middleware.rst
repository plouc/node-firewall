The middleware
==============

The module provides an easy way to integrate it to an existing express based application.

Usage
-----

.. code-block:: javascript

   var firewall = require('node-firewall');

   // configure the firewalls
   firewall.map.fromConfig({
       'fw.main': {
           path:  '^/',
           rules: [
               [ '^/login', null   ],
               [ '^/',      ['role', 'user'] ]
           ]
       }
   });

   // plug it to the application
   firewall.use(app);

