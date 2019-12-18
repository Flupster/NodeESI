# PL NodeESI

This project is an axios wrapper for ESI using the Pandemic Legion DB Structure

#### Getting Started

Most of the docs from Axios are relevant as this just attaches some custom interceptors from the [official axios project](https://github.com/axios/axios)


#### Usage

Axios is promised based, so you can either use `.then()` or `await` but for examples I'll be using await

```JS
const { Esi, Token, KnexBind } = require('NodeESI')

//You need to bind a knex instance to NodeESI in order to talk with a DB
//check https://github.com/knex/knex for more info

const knex = require("knex")(require("./knexfile")[process.env.NODE_ENV]);
KnexBind(knex);

//Non authed requests
const type_ids = await Esi.get('/universe/types');
console.log(type_ids.data);

//Authed requests
const token = await Token.query().limit(1).first();
const assets = await Esi.get(`/characters/${token.character_id}/assets`, { token: token })
console.log(assets.data)

//Auth and versioned request
const fleet = await Esi.get(`/characters/${token.character_id}/fleet`, { 
    token, //short for token: token
    version: 'dev'
});
console.log(fleet.data)

```

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
