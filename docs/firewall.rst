Firewall
========

A firewall have a path, this path determine if it should apply
on an incoming request by checking that the request url match it.

Then, if the firewall handle the request, it checks if it have
an available rule to apply to it by checking its url and optionally
its http method.

A rule is composed of a **path** (a RegExp), a **list of roles** (an array)
authorized to access the resource, and, as seen previously an optional
**http method**.
