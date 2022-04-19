const colors = require("colors/safe");
const session = require("express-session");
const axios = require("axios").default;

const Oauth2Controller = (settings) => {
  const logOut = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.send(err);
      }
      res.redirect("/");
    });
  };

  const callback = async (req, res) => {
    try {
      if (req.session.signedUserDetails) {
        return res.redirect("/");
      }

      const processResponse = await axios.post(
        `${settings.server.oauth2BaseUrl}/${settings.server.oauth2CallbackProcessor}`,
        { ...req.query }
      );

      if (processResponse.status === 200) {
        req.session.signedUserDetails = { ...processResponse.data.content };
        return res.redirect("/");
      }

      // TODO add error page

      return res.json(processResponse.data);
    } catch (error) {
      console.log(colors.red(error));
      return res.send(error.message);
    }
  };

  const oauth2Protection = async (req, res, next) => {
    try {
      if (!req.session.signedUserDetails) {
        const authorizationResponse = await axios.post(
          `${settings.server.oauth2BaseUrl}/${settings.server.oauth2AuthorizeUrl}`,
          { token: settings.server.token }
        );
        return res.status(302).redirect(authorizationResponse.data.content.url);
      }
      next();
    } catch (error) {
      console.log(colors.red(error));
      return res.send(error.message);
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

  return { logOut, callback, oauth2Protection, configureSession };
};

module.exports = Oauth2Controller;
