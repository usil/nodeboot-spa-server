#!/usr/bin/env node

'use strict';

const express = require('express');
const colors = require('colors/safe');
const argvs = require('../lib/argvs.js');
const startServer = require('./serve.js');
const app = express();
const argv = require('minimist')(process.argv.slice(2));


argvs().helpBehaviour(argv);
const staticFolderName = argvs().getStaticDirName(argv);
const port = argvs().getPort(argv);
const settingsPath = argvs().setSettingsPath(argv);

if (process.platform === 'win32') {
  require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  }).on('SIGINT', function () {
    process.emit('SIGINT');
  });
}

const allowedExt = [
  '.js',
  '.ico',
  '.css',
  '.png',
  '.jpg',
  '.woff2',
  '.woff',
  '.ttf',
  '.svg',
  '.jpeg',
  '.json',
  '.webmanifest'
];

startServer(app, allowedExt, port, argv['allow-routes'], staticFolderName, settingsPath);

process.on('SIGINT', function () {
  console.log(colors.red('Server stopped.'));
  process.exit();
});

process.on('SIGTERM', function () {
  console.log(colors.red('Server stopped.'));
  process.exit();
});