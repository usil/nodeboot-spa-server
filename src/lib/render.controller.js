const path = require("path");
const axios = require("axios").default;

const renderController = (
  allowedExt,
  processFolderPath,
  staticPath,
  settings
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
        delete normalSettings["server"];
        return res.json(normalSettings);
      }

      const expiresInRaw = req.session.signedUserDetails.expiresIn;
      const expiresIn = parseInt(expiresInRaw.slice(0, -1)) * 1000;

      const generatedAt = req.session.signedUserDetails.generatedAt;

      const expiresAt = expiresIn + generatedAt;

      const intervals = settings.oauth2TimerRefreshInterval.split(":");

      const preInterval = parseInt(intervals[0]) * 1000;
      const postInterval = parseInt(intervals[1]) * 1000;

      const now = Date.now();

      if (expiresAt + postInterval > now) {
        const destroy$ = new Promise((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) {
              reject(err);
            }

            resolve();
          });
        });
        await destroy$();
        const expiredSettings = { ...settings };
        delete expiredSettings["server"];
        return res.json(expiredSettings);
      }

      if (now >= expiresAt - preInterval && expiresAt + postInterval <= now) {
        const refreshResponse = await axios.post(
          `${settings.server.oauth2BaseUrl}${settings.server.oauth2RefreshTokenUrl}`,
          {
            refreshToken: req.session.signedUserDetails.refreshToken,
            grantType: "refresh_token",
          }
        );

        req.session.signedUserDetails.generatedAt = Date.now();
        req.session.signedUserDetails.accessToken =
          refreshResponse.data.content.accessToken;
        req.session.signedUserDetails.expiresIn =
          refreshResponse.data.content.expiresIn;
      }

      const exposedSettings = {
        ...settings,
        signedUserDetails: req.session.signedUserDetails,
      };

      delete exposedSettings["server"];
      delete exposedSettings["signedUserDetails"]["refreshToken"];

      return res.json(exposedSettings);
    } catch (error) {
      return res.send(error.message);
    }
  };

  return { allowedRoutesRender, renderSettingJson };
};

module.exports = renderController;
