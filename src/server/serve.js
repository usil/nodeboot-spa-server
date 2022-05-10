"use strict";

require("dotenv").config();
const processFolderPath = process.cwd();
const path = require("path");
const fs = require("fs/promises");
const EnvSettings = require("advanced-settings").EnvSettings;
const express = require("express");
const RenderController = require("../lib/render.controller");
const envSettings = new EnvSettings();

const log4js = require("log4js");

log4js.configure({
  appenders: {
    console: { type: "console" },
  },
  categories: {
    ["spa-server"]: { appenders: ["console"], level: "trace" },
    default: { appenders: ["console"], level: "trace" },
  },
});

const logger = log4js.getLogger("spa-server");

const startServer = async (app, allowedExt, argvSettings, allowRoutes) => {
  logger.info("Configuring server");
  try {
    let settings = {};
    let serverSettings = {};

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    for (var key in process.env) {
      if (key.startsWith("SPA_VAR")) {
        settings[key.replace("SPA_VAR_", "")] = process.env[key];
      }
    }

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

      logger.level = serverSettings.loggerLevel || "trace";

      const plugins = serverSettings.plugins;

      if (plugins && plugins.length > 0) {
        const localPackageRaw = await fs.readFile(
          path.join(processFolderPath, "package.json"),
          "utf8"
        );

        const localPackage = JSON.parse(localPackageRaw);

        for (const plugin of plugins) {
          if (localPackage.dependencies[plugin.module] === undefined) {
            throw new Error(`Module for plugin ${plugin.module} was not found`);
          }

          logger.info(`Configuring ${plugin.module} plugin ...`);

          const pluginStartFunction = require(path.join(
            processFolderPath,
            "node_modules",
            plugin.module
          ));

          pluginStartFunction(app, serverSettings, logger);

          logger.info(`${plugin.module} plugin added`);
        }
      }
    }

    const renderController = RenderController(
      allowedExt,
      processFolderPath,
      argvSettings.staticFolderName,
      settings
    );

    app.get("/settings.json", renderController.renderSettingJson);

    if (allowRoutes) {
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
      logger.info(`Listening in http://localhost:${argvSettings.port}`);
    });

    return { server, app };
  } catch (error) {
    logger.fatal(error);
    process.exit(-1);
  }
};

module.exports = startServer;
