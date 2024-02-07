# koop-cache-apache-ignite

[![npm version][npm-img]][npm-url]
![coverage](./coverage.svg)

This is a "cache" plugin for the Koop Web Server.  It adheres to Koop's [plugin specification](https://koopjs.github.io/docs/development/cache).  Registering this plugin with Koop will cause it to replace its in-memory cache with a cache backed by Apache Ignite.

An important fact about Koop cache plugins -  registering a cache does not necessarily mean data from provider plugins will be cached.  The provider must set a `ttl` (in seconds) on its data payload for it to be cached by any cache-plugin. This gives the provider developer ultimate control over data caching.

## Why use the Apache-Ignite plugin?
Koop's default cache uses a simple key/value store to cache data in-memory.  This means you are using a chunk of your deployment machine's memory for the cache.  The size of cache entries  isn't limited by the in-memory cache-plugin (though the number of entries is limited), which makes it hard to plan for how much memory you need. In contrast, using a backing store like Apache Ignite is a much more scalable solution as you can provision the Ignite instance independently and it's memory consumption has no impact on the web-server.

Using a plugin like the Apache-Ignite cache also benefits deployments that leverage horizontal scaling of the web-server.  Imagine you are using the default in-memory cache and that you are deploying multiple Koop server instances with traffic routed to each by a load balancer.  In this architecture, each Koop server has its own cache. Caching is therefore inefficient; a cache entry on server (A) is not accessible to server (B). Rather, each server instance has to build up its own cache.  Alternatively, if you use the Apache-Ignite plugin with an independently deployed Apache-Ignite backing store, each Koop server instance will share a single cache; entries cached by server (A) can be retrieved by server (B).

## Usage
### As a Koop cache plugin

#### With registration options:
```js
const Koop = require('koop')
const koop = new Koop()
const cache = require('@koopjs/cache-apache-ignite')
koop.register(cache, {
  connStr: '127.0.0.1:10800', // connection string for the Ignite deployment,
  cacheName: 'koop-ignite-cache' // a name to use for the cache; will be created if not found
})
```

#### With options set in "node-config" module:

Create a configuration json file (see [node-config](https://www.npmjs.com/package/config) for details).
```json
{
  "apacheIgnite": {
    "connStr": "127.0.0.1:10800",
    "cacheName": "koop-ignite-cache"
  }
}
```

Then register the cache plugin without options.
```js
const Koop = require('koop')
const koop = new Koop()
const cache = require('@koopjs/cache-apache-ignite')
koop.register(cache)
```

[npm-img]: https://img.shields.io/npm/v/@koopjs/cache-apache-ignite.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@koopjs/cache-apache-ignite