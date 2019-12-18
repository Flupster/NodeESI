const { Model } = require("objection");
const Token = require("./Token");
const TokenScope = require("./TokenScope");
const EsiClient = require("./EsiClient");

module.exports = {
  Token,
  TokenScope,
  EsiClient,
  Esi: EsiClient, //shortname
  Model,
  KnexBind: knex => Model.knex(knex)
};
