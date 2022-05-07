const helpers = (_colors) => {
  const handleAxiosError = (error, res, log, errorPage) => {
    let errorData = {};
    log.error(error);
    if (error.response) {
      errorData = {
        message: error.message,
        errorResponse: error.response.data,
        requestHeaders: error.response.headers,
        // requestData: error.config.data,
        requestMethod: error.config.method,
        requestUrl: error.config.url,
      };
      log.error(errorData);
    }
    if (errorPage) {
      return res.redirect(errorPage + `?code=500`);
    }
    return res.json(errorData);
  };

  return { handleAxiosError };
};

module.exports = helpers;
