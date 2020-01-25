# PL NodeESI

This project is an axios wrapper for ESI using the Pandemic Legion DB Structure

### Install

Make sure you have a pubkey into PL gitlab and configure ssh ~/.ssh/config with the port to 1420  
then run: ```npm i --save git+ssh://git@git.pandemic-legion.pl:Floppy/node-esi.git```

NodeESI also uses redis as a caching layer, you will need redis-server installed before you can use NodeESI  
You can install redis-server by running: ```sudo apt install redis-server```

You can disable the caching layer by having `DISABLE_ESI_CACHE` set to true in your enviroment variables  

```BASH
DISABLE_ESI_CACHE=true node script.js
````

#### Getting Started

Most of the docs from Axios are relevant as this just attaches some custom interceptors from the [official axios project](https://github.com/axios/axios)


#### Usage

Axios is promised based, so you can either use `.then()` or `await` but for examples I'll be using await

```javascript
const { Esi, Token, KnexBind } = require('node-esi')

//You need to bind a knex instance to NodeESI in order to talk with a DB
//check https://github.com/knex/knex for more info

const knex = require("knex")(require("./knexfile")[process.env.NODE_ENV]);
KnexBind(knex);

//Non authed requests
const type_ids = await Esi.get('/universe/types');
console.log(type_ids.data);

//Authed requests
const token = await Token.query().limit(1).first();
const assets = await Esi.get(`/characters/${token.character_id}/assets`, { token: token });
console.log(assets.data);

//Auth and versioned request
const fleet = await Esi.get(`/characters/${token.character_id}/fleet`, { 
    token, //short for token: token
    version: 'dev'
});
console.log(fleet.data);

```

#### Concurrency Manager

A concurrency manager is attached to the Axios instance and is defaulted to 10 concurrent requests, this can be disabled with

```javascript
const { Manager } = require('node-esi');
Manager.detach();
```

You can also set `ESI_CONCURRENCY` in your env to increase or decrease concurrent requests

#### DB Structure

The main EsiSeat project handles adding Eve SSO tokens and therefor uses the schemas from that project, NodeESI just mimics the PHP EsiClient package for refreshing tokens

Here is the schema for the `tokens` table

    CREATE TABLE IF NOT EXISTS `tokens` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `character_id` bigint(20) NOT NULL,
    `character_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `token_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `character_owner_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `access_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
    `refresh_token` text COLLATE utf8mb4_unicode_ci NOT NULL,
    `expires` datetime NOT NULL,
    `deleted_at` timestamp NULL DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `tokens_user_id_index` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### Enviroment variables

These enviroment variables are required if you are to use authed requests to the API

    SSO_CLIENT_ID = The Eve SSO Client ID
    SSO_SECRET  = The Eve SSO Secret
    SSO_TOKEN_URI  = URI to fetch tokens usually https://login.eveonline.com/oauth/token
    SSO_VERIFY_URI  = URI to verify usually https://login.eveonline.com/oauth/verify
