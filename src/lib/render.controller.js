const colors = require("colors/safe");
const path = require("path");
const axios = require("axios").default;
const Helpers = require("./helpers");

const helpers = Helpers(colors);

const renderController = (
  allowedExt,
  processFolderPath,
  staticPath,
  settings,
  serverSettings,
  log
) => {
  const allowedRoutesRender = (req, res) => {
    if (allowedExt.filter((ext) => req.url.indexOf(ext) > 0).length > 0) {
      res.sendFile(
        path.resolve(`${path.join(processFolderPath, staticPath)}/${req.url}`)
      );
    } else {
      res.sendFile(
        path.resolve(`${path.join(processFolderPath, staticPath)}/index.html`)
      );
    }
  };

  const renderSettingJson = async (req, res) => {
    try {
      if (!req.session || !req.session.signedUserDetails) {
        const normalSettings = {
          ...settings,
        };
        return res.json(normalSettings);
      }

      const expiresInRaw = req.session.signedUserDetails.expiresIn;
      const expiresIn = parseInt(expiresInRaw.slice(0, -1)) * 1000;

      const generatedAt = req.session.signedUserDetails.generatedAt;

      const expiresAt = expiresIn + generatedAt;

      const preInterval =
        parseInt(serverSettings.oauth2SecondsForRefreshTokenBeforeExpiration) * 1000;

      const postInterval =
        parseInt(serverSettings.oauth2MaxAllowedIdleTime) * 1000;

      const updatedSessionAt = req.session.signedUserDetails.updatedSessionAt;

      const now = Date.now();

      if (updatedSessionAt + postInterval < now) {
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
        const expiredSettings = { ...settings };
        return res.json(expiredSettings);
      }

      if (
        now >= expiresAt - preInterval &&
        updatedSessionAt + postInterval >= now
      ) {
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
      } else {
        req.session.signedUserDetails.tokenStatus = "stable";
      }

      req.session.signedUserDetails.updatedSessionAt = Date.now();

      const exposedSettings = {
        ...settings,
        signedUserDetails: { ...req.session.signedUserDetails },
      };

      delete exposedSettings["signedUserDetails"]["refreshToken"];

      return res.json(exposedSettings);
    } catch (error) {
      helpers.handleAxiosError(error, res, log);
    }
  };

  return { allowedRoutesRender, renderSettingJson };
};

module.exports = renderController;
