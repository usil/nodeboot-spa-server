"use strict";

require("dotenv").config();
const processFolderPath = process.cwd();
const path = require("path");
const EnvSettings = require("advanced-settings").EnvSettings;
const colors = require("colors/safe");
const express = require("express");
const RenderController = require("../lib/render.controller");
const Oauth2Controller = require("../lib/oauth2.controller");
const envSettings = new EnvSettings();
const bunyan = require("bunyan");
const log = bunyan.createLogger({ name: "spa-server" });

const startServer = async (app, allowedExt, argvSettings, allowRoutes) => {
  try {
    let settings = {};
    let serverSettings = {};

    if (argvSettings.settingsPath) {
      settings = await envSettings.loadJsonFile(
        path.join(processFolderPath, argvSettings.settingsPath),
        "utf8"
      );
    }

    if (argvSettings.serverSettingsPath) {
      serverSettings = await envSettings.loadJsonFile(
        path.join(processFolderPath, argvSettings.serverSettingsPath),
        "utf8"
      );
    }

    for (var key in process.env) {
      if (key.startsWith("SPA_VAR")) {
        settings[key.replace("SPA_VAR_", "")] = process.env[key];
      }
    }

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const renderController = RenderController(
      allowedExt,
      processFolderPath,
      argvSettings.staticFolderName,
      settings,
      serverSettings
    );

    const oauth2Controller = Oauth2Controller(serverSettings);

    if (argvSettings.useOauth2) {
      oauth2Controller.configureSession(app, argvSettings.useHttps);

      app.get("/oauth2/callback", oauth2Controller.callback);

      app.get("/oauth2/logout", oauth2Controller.logOut);

      app.get("/oauth2/login", oauth2Controller.logIn);
    }

    app.get("/settings.json", renderController.renderSettingJson);

    if (allowRoutes && argvSettings.useOauth2) {
      app.get(
        "*",
        oauth2Controller.oauth2Protection,
        renderController.allowedRoutesRender // render angular
      );
    } else if (!allowRoutes && argvSettings.useOauth2) {
      app.use(
        "/",
        oauth2Controller.oauth2Protection,
        express.static(
          path.join(processFolderPath, `${argvSettings.staticFolderName}`)
        )
      );
    } else if (allowRoutes) {
      app.get("*", renderController.allowedRoutesRender);
    } else {
      app.use(
        "/",
        express.static(
          path.join(processFolderPath, `${argvSettings.staticFolderName}`)
        )
      );
    }

    const server = app.listen(argvSettings.port, () => {
      log.info(`Listening in http://localhost:${argvSettings.port}`);
    });

    return { server, app };
  } catch (error) {
    console.log(colors.red(error));
    process.exit(-1);
  }
};

module.exports = startServer;
