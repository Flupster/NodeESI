const crypto = require("crypto");
const axios = require("axios");
const sleep = require("util").promisify(setTimeout);

//TODO: allow redis connection to be configured other than default.
const Redis = require("ioredis");
const redis = new Redis();

async function CacheAdapter(config) {
  const cache = new Cache(config);
  await cache.check();

  if (cache.exists) {
    cache.response.cached = true;
    cache.response.config = config;
    return cache.response;
  }

  config.adapter = axios.default.adapter;
  const response = await makeRequest(config);
  if (response.headers.expires) {
    cache.cacheResponse(response);
  }

  response.cached = false;
  return response;
}

async function EsiAdapter(config) {
  config.adapter = axios.default.adapter;
  return await makeRequest(config);
}

async function makeRequest(config) {
  try {
    return await axios(config);
  } catch (ex) {
    /*
     * If no response throw the exception
     */

    if (!ex.response) throw ex;

    /*
     * If the error is a 502, then CCP's API isn't doing well
     * We combat this by retrying it up to 3 times
     */

    if ([502, 504].includes(ex.response.status)) {
      config.retries = config.retries ? config.retries + 1 : 1;
      if (config.retries > 3) throw ex;
      else return makeRequest(config);
    }

    /*
     * If the ratelimit is less than 10 remaining requests
     * sleep until the ratelimit is reset then throw the exception
     */

    if (ex.response.headers["x-esi-error-limit-remain"] < 10) {
      const reset = ex.response.headers["x-esi-error-limit-reset"];
      console.warn(`NodeESI: Ratelimit has been reached, sleeping for ${reset}s`);
      await sleep(reset * 1000);
      throw ex;
    }

    /*
     * finally throw the exception
     */

    throw ex;
  }
}

class Cache {
  constructor(config) {
    this.config = config;
    this.hash = this.getHash(config);
  }

  async check() {
    this.cache = await redis.get(this.hash);
    this.exists = Boolean(this.cache);
    this.response = JSON.parse(this.cache);
  }

  getHash() {
    const data = JSON.stringify({
      url: this.config.url,
      method: this.config.method,
      auth: this.config.headers.Authorization
    });

    return crypto
      .createHash("sha1")
      .update(data)
      .digest("hex");
  }

  async cacheResponse(request) {
    const expires = +new Date(request.headers.expires) - +new Date(request.headers.date);
    const data = JSON.stringify({
      status: request.status,
      statusText: request.statusText,
      headers: request.headers,
      data: request.data,
      url: request.url
    });

    return await redis.setex(this.hash, expires / 1000 + 1, data);
  }
}

module.exports = {
  CacheAdapter,
  EsiAdapter
};
