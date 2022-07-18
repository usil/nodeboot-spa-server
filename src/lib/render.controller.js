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

  const renderSettingJson = async (_req, res) => {
    const exposedSettings = {
      ...settings,
      extraSettings: {...(res.locals.extraSettings || {})},
    };

    return res.json(exposedSettings);
  };

  return { allowedRoutesRender, renderSettingJson };
};

module.exports = renderController;
