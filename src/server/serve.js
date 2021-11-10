const processFolderPath = process.cwd();
const path = require('path');
const EnvSettings = require('advanced-settings').EnvSettings;
const colors = require('colors/safe');
const express = require('express');

const envSettings = new EnvSettings();

const startServer = async (app, allowedExt, port, allowRoutes, staticPath, settingsPath) => {
  try {
    let settings = {};
  
    if (settingsPath) {
      settings = await envSettings.loadJsonFile(path.join(processFolderPath, settingsPath), 'utf8');
    } else {
      for(var key in process.env){
        if(key.startsWith("SPA_VAR")){
          settings[key.replace("SPA_VAR_","")] = process.env[key];
        }
      }
    }
    app.get('/settings.json', function(req, res) {
      return res.json(settings);
    });
  
    if (allowRoutes) {
      app.get('*', (req, res) => { 
        if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
            res.sendFile(path.resolve(`${path.join(processFolderPath, `${staticPath}`)}/${req.url}`));
          } else {
            res.sendFile(path.resolve(`${path.join(processFolderPath, `${staticPath}`)}/index.html`));
          }
      });
    } else {
      app.use('/',
        express.static(path.join(processFolderPath, `${staticPath}`)),
      );
    }
    const server = app.listen(port, () => console.log(colors.blue(`Listening in http://localhost:${port}`)));
    return { server, app };
  } catch (error) {
    console.log(colors.red(error));
    process.exit(-1);
  }
}

module.exports = startServer;