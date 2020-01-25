
const Token = require("./Token");

async function request(config) {
    config.requestStart = process.hrtime.bigint()
    if (!config.url.startsWith('/')) {
        config.url = "/" + config.url
    }

    config.url = (config.version || "latest") + config.url;

    if (config.token instanceof Token) {
        if (config.token.isExpired()) await config.token.refresh();

        config.headers = {
            Authorization: "Bearer " + config.token.access_token
        };
    }

    return config;
}

async function response(res) {
    res.requestTime = parseInt(process.hrtime.bigint() - res.config.requestStart)
    return res
}

async function requestError(error) {
    return Promise.reject(error)
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
    responseError,
}