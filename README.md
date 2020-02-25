# Node ESI

Node ESI is a wrapper for the common http library [Axios](https://github.com/axios/axios) reading the docs for Axios will give you an idea of how Node ESI works

### Usage

```javascript
const Esi = require('node-esi');
Esi('alliances').then(console.log).catch(console.error);
```

### Cache

You can enable a redis cache by simply passing a redis uri to the cache function, afterwards all requests that can be cached locally will be

```javascript
Esi.cache('redis://127.0.0.1');
```

### Concurrency Manager

There is a concurrency manager loaded at start, you can detach the concurrency manager with

```javascript
// Detaches the concurrency manager
Esi.manager.detach();
```

You can also set a new concurrency manager by doing:

```javascript
// Set Concurrency to 5 requests at the same time
Esi.manager.detach();
Esi.manager = ConcurrencyManager(Esi, 5);
```

### SSO Auth

Node ESI uses [Objection](https://github.com/Vincit/objection.js/) ORM for managing tokens, the default model located at src/Token.js but you can supply your own Objection model, for more information please read the docs for the Token object at src/Token.js

Knex is an important part of authentication which manages the DB connection, you need to bind knex to the client before making any database calls

This can be fully managed in your own Token.js logic or via Node ESI

```javascript
const Esi = require("node-esi");
const Token = require("path_to_custom_objection_model"); //Custom
const Knex = require("knex");
const db = Knex({
    client: "mysql",
    useNullAsDefault: true,
    connection: {
      host: "127.0.0.1",
      user: "user_name",
      password: "password",
      database: "database_name",
      charset: "utf8mb4",
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    pool: { min: 1, max: 5 }
});

Esi.knex(db);
Esi.defaults.model = Token;
```

### Examples

```javascript
const Esi = require("node-esi");
const Token = require("node-esi/Token");
const Knex = require("knex"); 

Esi.knex(Knex({})) //knex config...

(async () => {
    //Load a token with Objection
    const token = await Token.query().where({character_name: 'Falopadous'}).first();

    //Non Authed Request
    const alliances = await Esi('alliances');

    //Authed request
    const assets = await Esi(`characters/${token.character_id}/assets`, { token });
    
    //Versioning
    const fleet = await Esi(`characters/${token.character_id}/fleet`, { 
        version: 'dev',
        token: token
    });

    console.log("Request data", alliances.data)
    console.log("Request Time", alliances.requestTime)
})();
```