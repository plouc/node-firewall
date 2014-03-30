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
               [ '^/',      'user' ]
           ]
       }
   });

   // success handler
   firewall.map.get('fw.main').successHandler = function (req, res, next) {
        next(); // access granted
   };

   // failure handler
   firewall.map.get('fw.main').failureHandler = function (req, res, next) {
        // access denied
        res.status(401);
        return res.send({ status : 401 });
    });

   // plug it to the application
   firewall.use(app);

