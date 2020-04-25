const axios = require("axios");
const interceptors = require("./interceptors");
const https = require("https");
const httpsAgent = new https.Agent({ keepAlive: true });
const package = require("../package.json");
const { ConcurrencyManager } = require("axios-concurrency");
const { Model } = require("objection");
const Redis = require("ioredis");

const instance = axios.create({
  baseURL: "https://esi.evetech.net/",
  timeout: 11000,
  httpsAgent,
  model: require("./Token"),
  redis: null,
});

instance.defaults.headers.common["User-Agent"] =
  process.env.AXIOS_USER_AGENT ||
  `NodeESI v${package.version} - ${package.url}`;

//Setup Interceptors
instance.interceptors.request.use(
  interceptors.request,
  interceptors.requestError
);

instance.interceptors.response.use(
  interceptors.response,
  interceptors.responseError
);

//DB Binding
instance.knex = knex => Model.knex(knex);

//Concurrency Binding
instance.manager = ConcurrencyManager(
  instance,
  process.env.ESI_CONCURRENCY || 10
);

//Cache
instance.cache = uri => (instance.defaults.redis = new Redis(uri));
module.exports = instance;
