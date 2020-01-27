const axios = require("axios");
const interceptors = require("./interceptors")
const https = require("https");
const httpsAgent = new https.Agent({ keepAlive: true });
const adapter = process.env.DISABLE_ESI_CACHE === 'true' ? axios.default.adapter : require("./adapter")

const instance = axios.create({
  baseURL: "https://esi.evetech.net/",
  timeout: 11000,
  httpsAgent,
  adapter
});

instance.interceptors.request.use(
  interceptors.request,
  interceptors.requestError
);

instance.interceptors.response.use(
  interceptors.response,
  interceptors.responseError
);

module.exports = instance;
