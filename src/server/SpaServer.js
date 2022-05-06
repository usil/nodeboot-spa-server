#!/usr/bin/env node

"use strict";

const express = require("express");
const colors = require("colors/safe");
const argvs = require("../lib/argvs.js");
const startServer = require("./serve.js");
const app = express();
const argv = require("minimist")(process.argv.slice(2));

argvs().helpBehavior(argv);

const settings = {
  staticFolderName: argvs().getStaticDirName(argv),
  port: argvs().getPort(argv),
  settingsPath: argvs().setSettingsPath(argv),
  serverSettingsPath: argvs().setServerSettingsPath(argv),
  useOauth2: argvs().useOauth2(argv),
  useHttps: argvs().useHttps(argvs),
};

if (process.platform === "win32") {
  require("readline")
    .createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    .on("SIGINT", function () {
      process.emit("SIGINT");
    });
}

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

startServer(app, allowedExt, settings, argv["allow-routes"]);

process.on("SIGINT", function () {
  console.log(colors.red("Server stopped."));
  process.exit();
});

process.on("SIGTERM", function () {
  console.log(colors.red("Server stopped."));
  process.exit();
});
