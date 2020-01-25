const { Model } = require("objection");
const { ConcurrencyManager } = require("axios-concurrency");
const Token = require("./Token");
const TokenScope = require("./TokenScope");
const EsiClient = require("./EsiClient");

const Manager = ConcurrencyManager(EsiClient, process.env.ESI_CONCURRENCY || 10);

module.exports = {
  Token,
  TokenScope,
  EsiClient,
  Esi: EsiClient, //shortname
  Manager, //exported for detaching concurrency manager
  Model,
  KnexBind: knex => Model.knex(knex)
};
