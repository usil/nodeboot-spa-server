const helpers = (_colors) => {
  const handleAxiosError = (error, res, log, errorPage) => {
    let errorData = {};
    if (error.response) {
      errorData = {
        message: error.message,
        errorResponse: error.response.data,
        requestHeaders: error.response.headers,
      };
    } else {
      errorData = {
        message: error.message,
      };
    }
    console.log(error);
    log.error(errorData);
    if (errorPage) {
      return res.redirect(errorPage + `?code=500`);
    }
    return res.json(errorData);
  };

  return { handleAxiosError };
};

module.exports = helpers;
