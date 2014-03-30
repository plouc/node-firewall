.. node-firewall documentation master file, created by
   sphinx-quickstart on Sun Mar 30 01:18:21 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to node-firewall's documentation!
=========================================

The firewall module helps to handle **authorization** based on **roles** and init **authentication process**.

It exposes three main components:

* A **FirewallMap**
* A **Firewall**
* A **middleware** to easily plug it to express

This module was build to work in conjunction with `passport <https://github.com/jaredhanson/passport/>`_ which
is in charge of user **authentication**.

Contents:

.. toctree::
   :maxdepth: 2

   firewall
   firewall-map
   middleware


