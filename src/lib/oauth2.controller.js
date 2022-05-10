const colors = require("colors/safe");
const session = require("express-session");
const axios = require("axios").default;
const Helpers = require("./helpers");

const helpers = Helpers(colors);

const Oauth2Controller = (serverSettings, log) => {
  const ping = (req, res) => {
    if (!req.session || !req.session.signedUserDetails) {
      return res.send(0);
    }
    req.session.signedUserDetails.tokenStatus = "stable";
    req.session.signedUserDetails.updatedSessionAt = Date.now();
    return res.send(req.session.signedUserDetails.updatedSessionAt);
  };

  const logOut = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send(err);
      }
      res.redirect(serverSettings.loginPage || "/");
    });
  };

  const logIn = async (req, res) => {
    try {
      if (req.session.signedUserDetails) {
        return res.redirect(serverSettings.successPage || "/");
      }
      const authorizationResponse = await axios.post(
        `${serverSettings.oauth2BaseUrl}${serverSettings.oauth2AuthorizeUrlEndpoint}`,
        { clientId: serverSettings.oauth2ClientId }
      );
      return res.status(302).redirect(authorizationResponse.data.content.url);
    } catch (error) {
      helpers.handleAxiosError(error, res, log, serverSettings.errorPage);
    }
  };

  const refreshToken = async (req, res) => {
    try {
      const idleTime = parseInt(serverSettings.oauth2MaxAllowedIdleTime) * 1000;

      const updatedSessionAt = req.session.signedUserDetails.updatedSessionAt;

      const now = Date.now();

      if (updatedSessionAt + idleTime < now) {
        const destroy$ = () => {
          return new Promise((resolve, reject) => {
            req.session.destroy((err) => {
              if (err) {
                reject(err);
              }
              resolve();
            });
          });
        };
        await destroy$();
        return res.json({
          message: "Session timeout due to idle time",
          code: 403001,
        });
      }

      const refreshResponse = await axios.post(
        `${serverSettings.oauth2BaseUrl}${serverSettings.oauth2RefreshTokenEndpoint}`,
        {
          refreshToken: req.session.signedUserDetails.refreshToken,
          grantType: "refresh_token",
        }
      );

      req.session.signedUserDetails.tokenStatus = "renewed";
      req.session.signedUserDetails.generatedAt = Date.now();
      req.session.signedUserDetails.accessToken =
        refreshResponse.data.content.accessToken;
      req.session.signedUserDetails.expiresIn =
        refreshResponse.data.content.expiresIn;

      return res.json({
        message: "New token generated",
        code: 200001,
        content: {
          accessToken: refreshResponse.data.content.accessToken,
        },
      });
    } catch (error) {
      log.error(error);
      if (error.response) {
        log.error(error.response.data);
        log.error(error.response.status);
        log.error(error.response.headers);
        return res.json({
          message: error.message,
          responseData: error.response.data,
          responseStatus: error.response.status,
          responseHeader: error.response.headers,
        });
      }
      return res.json({ message: error.message });
    }
  };

  const callback = async (req, res) => {
    try {
      if (req.session.signedUserDetails) {
        return res.redirect(serverSettings.loginPage || "/");
      }

      const processResponse = await axios.post(
        `${serverSettings.oauth2BaseUrl}${serverSettings.oauth2TokenUserEndpoint}`,
        {
          authorizationCode: req.query.code,
          grantType: "authorization_code",
          clientId: serverSettings.oauth2ClientId,
          applicationIdentifier: serverSettings.applicationIdentifier,
        }
      );

      if (processResponse.status === 200) {
        req.session.signedUserDetails = {
          ...processResponse.data.content,
          generatedAt: Date.now(),
          updatedSessionAt: Date.now(),
          tokenStatus: "created",
        };
        return res.redirect(serverSettings.successPage || "/");
      }

      // TODO add error page

      return res.json(processResponse.data);
    } catch (error) {
      helpers.handleAxiosError(error, res, log, serverSettings.errorPage);
    }
  };

  const oauth2Protection = async (req, res, next) => {
    try {
      const allowedExt = [
        ".js",
        ".ico",
        ".css",
        ".png",
        ".jpg",
        ".woff2",
        ".woff",
        ".ttf",
        ".svg",
        ".jpeg",
        ".json",
        ".webmanifest",
      ];

      const completeRequestUrl = req.baseUrl + req.path;

      const indexInPublicPages =
        serverSettings.publicPages.indexOf(completeRequestUrl);

      if (
        completeRequestUrl === serverSettings.loginPage &&
        req.session.signedUserDetails
      ) {
        return res.redirect(serverSettings.successPage || "/");
      }

      if (
        completeRequestUrl === serverSettings.loginPage ||
        completeRequestUrl === serverSettings.errorPage ||
        indexInPublicPages > -1 ||
        allowedExt.filter((ext) => req.url.indexOf(ext) > 0).length > 0
      ) {
        return next();
      }

      if (!req.session.signedUserDetails) {
        if (serverSettings.loginPage) {
          return res.redirect(serverSettings.loginPage);
        }
        const authorizationResponse = await axios.post(
          `${serverSettings.oauth2BaseUrl}${serverSettings.oauth2AuthorizeUrlEndpoint}`,
          { clientId: serverSettings.oauth2ClientId }
        );
        return res.status(302).redirect(authorizationResponse.data.content.url);
      }
      next();
    } catch (error) {
      helpers.handleAxiosError(error, res, log, serverSettings.errorPage);
    }
  };

  const configureSession = (app, useHttps = false) => {
    const sessionSettings = {
      saveUninitialized: false,
      secret: serverSettings.sessionSecret,
      resave: false,
      cookie: {
        secure: false,
        maxAge: serverSettings.cookieMaxAge || 60000,
      },
    };

    if (useHttps) {
      app.set("trust proxy", 1);
      sessionSettings.cookie.secure = true;
    }

    app.use(session(sessionSettings));
  };

  return {
    logOut,
    callback,
    oauth2Protection,
    configureSession,
    logIn,
    ping,
    refreshToken,
  };
};

module.exports = Oauth2Controller;
