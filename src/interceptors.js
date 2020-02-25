const adapters = require("./adapter");

async function request(config) {
  config.requestStart = process.hrtime.bigint();
  if (!config.url.startsWith("/")) {
    config.url = "/" + config.url;
  }

  config.url = (config.version || "latest") + config.url;

  if (config.model && config.token instanceof config.model) {
    if (config.token.isExpired()) await config.token.refresh();

    config.headers = {
      Authorization: "Bearer " + config.token.access_token
    };
  }

  //If we have redis connection assume using cache adapter
  config.adapter = config.redis ? adapters.CacheAdapter : adapters.EsiAdapter;
  return config;
}

async function response(res) {
  res.requestTime = parseInt(process.hrtime.bigint() - res.config.requestStart);
  return res;
}

async function requestError(error) {
  return Promise.reject(error);
}

async function responseError(error) {
  if (!error.response) {
    return Promise.reject(error);
  } else {
    return Promise.reject({
      status: error.response.status,
      message: error.response.data.error,
      url: error.config.url,
      ratelimit: {
        remain: parseInt(error.response.headers["x-esi-error-limit-remain"]),
        reset: parseInt(error.response.headers["x-esi-error-limit-reset"])
      }
    });
  }
}

module.exports = {
  request,
  response,
  requestError,
  responseError
};
