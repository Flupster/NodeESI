const crypto = require("crypto");
const axios = require("axios");

//TODO: allow redis connection to be configured other than default.
const Redis = require("ioredis");
const redis = new Redis();

module.exports = async config => {
  const cache = new Cache(config);
  await cache.check();

  if (cache.exists) {
    cache.response.cached = true;
    cache.response.config = config
    return cache.response;
  }

  config.adapter = axios.default.adapter;
  const request = await axios(config);

  if (request.headers.expires) {
    cache.cacheResponse(request);
  }

  request.cached = false;
  return request;
};

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
