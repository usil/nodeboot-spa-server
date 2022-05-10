const colors = require("colors/safe");
const path = require("path");
const axios = require("axios").default;
const Helpers = require("./helpers");

const helpers = Helpers(colors);

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
    if (!req.session || !req.session.signedUserDetails) {
      const normalSettings = {
        ...settings,
      };
      return res.json(normalSettings);
    }

    const exposedSettings = {
      ...settings,
      signedUserDetails: { ...req.session.signedUserDetails },
    };

    delete exposedSettings["signedUserDetails"]["refreshToken"];

    return res.json(exposedSettings);
  };

  return { allowedRoutesRender, renderSettingJson };
};

module.exports = renderController;
