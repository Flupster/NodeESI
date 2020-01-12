const Token = require("./Token");
const axios = require("axios");
const adapter = require("./adapter");
const https = require("https");
const httpsAgent = new https.Agent({ keepAlive: true });

const instance = axios.create({
  baseURL: "https://esi.evetech.net/",
  timeout: 10000,
  httpsAgent,
  adapter
});

instance.interceptors.request.use(
  async config => {
    config.url = (config.version || "latest") + config.url;

    if (config.token instanceof Token) {
      if (config.token.isExpired()) await config.token.refresh();

      config.headers = {
        Authorization: "Bearer " + config.token.access_token
      };
    }

    return config;
  },
  error => Promise.reject(error)
);

instance.interceptors.response.use(
  response => response,
  error => {
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
);

module.exports = instance;
