const colors = require("colors/safe");
const session = require("express-session");
const axios = require("axios").default;
const Helpers = require("./helpers");

const helpers = Helpers(colors);

const Oauth2Controller = (settings) => {
  const logOut = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send(err);
      }
      res.redirect(settings.server.loginPage || "/");
    });
  };

  const logIn = async (req, res) => {
    try {
      if (req.session.signedUserDetails) {
        return res.redirect(settings.server.successPage || "/");
      }
      const authorizationResponse = await axios.post(
        `${settings.server.oauth2BaseUrl}${settings.server.oauth2AuthorizeUrl}`,
        { clientId: settings.server.oauth2ClientId }
      );
      return res.status(302).redirect(authorizationResponse.data.content.url);
    } catch (error) {
      helpers.handleAxiosError(error, res, settings.server.errorPage);
    }
  };

  const callback = async (req, res) => {
    try {
      if (req.session.signedUserDetails) {
        return res.redirect(settings.server.loginPage || "/");
      }

      const processResponse = await axios.post(
        `${settings.server.oauth2BaseUrl}${settings.server.oauth2TokenUserEndpoint}`,
        {
          authorizationCode: req.query.code,
          grantType: "authorization_code",
          clientId: settings.server.oauth2ClientId,
          applicationIdentifier: settings.server.applicationIdentifier,
        }
      );

      if (processResponse.status === 200) {
        req.session.signedUserDetails = {
          ...processResponse.data.content,
          generatedAt: Date.now(),
          updatedSessionAt: Date.now(),
          tokenStatus: "created",
        };
        return res.redirect(settings.server.successPage || "/");
      }

      // TODO add error page

      return res.json(processResponse.data);
    } catch (error) {
      helpers.handleAxiosError(error, res, settings.server.errorPage);
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
        settings.server.publicPages.indexOf(completeRequestUrl);

      if (
        completeRequestUrl === settings.server.loginPage ||
        completeRequestUrl === settings.server.errorPage ||
        indexInPublicPages > -1 ||
        allowedExt.filter((ext) => req.url.indexOf(ext) > 0).length > 0
      ) {
        return next();
      }

      if (!req.session.signedUserDetails) {
        if (settings.server.loginPage) {
          return res.redirect(settings.server.loginPage);
        }
        const authorizationResponse = await axios.post(
          `${settings.server.oauth2BaseUrl}${settings.server.oauth2AuthorizeUrl}`,
          { clientId: settings.server.oauth2ClientId }
        );
        return res.status(302).redirect(authorizationResponse.data.content.url);
      }
      next();
    } catch (error) {
      helpers.handleAxiosError(error, res, settings.server.errorPage);
    }
  };

  const configureSession = (app, useHttps = false) => {
    const sessionSettings = {
      saveUninitialized: false,
      secret: settings.server.sessionSecret,
      resave: false,
      cookie: {
        secure: false,
        maxAge: settings.server.cookieMaxAge || 60000,
      },
    };

    if (useHttps) {
      app.set("trust proxy", 1);
      sessionSettings.cookie.secure = true;
    }

    app.use(session(sessionSettings));
  };

  return { logOut, callback, oauth2Protection, configureSession, logIn };
};

module.exports = Oauth2Controller;
