const path = require("path");

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

  const renderSettingJson = (req, res) => {
    console.log(settings);
    const exposedSettings = {
      ...settings,
      signedUserDetails: req.session
        ? req.session.signedUserDetails
        : undefined,
    };
    delete exposedSettings["server"];
    return res.json(exposedSettings);
  };

  return { allowedRoutesRender, renderSettingJson };
};

module.exports = renderController;
