const request = require('supertest');
const express = require('express');
const startServer = require('../src/server/serve.js');
const app = express();
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
describe('Serve SPA', () => {
  let server;

  afterEach(() => {
    server.close();
  })  

  it('gets the full settings and deploys html', async () => {
    const createdServer = await startServer(app, allowedExt, 1, true, 'test/mocks/dist/test-setting-hack', 'test/mocks/settings.json');
    server = createdServer.server;

    request(createdServer.app).get('/').expect("Content-type",/html/).expect(200).end(function(err, res) {
      if (err) throw err;
    });

    request(createdServer.app).get('/favicon.ico').expect("Content-type",/ico/).expect(200).end(function(err, res) {
      if (err) throw err;
    });

    request(createdServer.app).get('/settings.json').expect("Content-type",/json/).expect(200).end(function(err, res) {
      if (err) throw err;
    });

    request(createdServer.app).get('/testDynamic').expect("Content-type",/html/).expect(200).end(function(err, res) {
      if (err) throw err;
    });
  })

  it('routes not allowed', async () => {
    const createdServer = await startServer(app, allowedExt, 1, false, 'test/mocks/dist/test-setting-hack', 'test/mocks/settings.json');
    server = createdServer.server;

    request(createdServer.app).get('/').expect("Content-type",/html/).expect(200).end(function(err, res) {
      if (err) throw err;
    });

    request(createdServer.app).get('/favicon.ico').expect("Content-type",/ico/).expect(200).end(function(err, res) {
      if (err) throw err;
    });

    request(createdServer.app).get('/testDynamic').expect("Content-type",/html/).end(function(err, res) {
      if (err) throw err;
    });
  })

  it('not settings file', async () => {
    const createdServer = await startServer(app, allowedExt, 1, false, 'test/mocks/dist/test-setting-hack');
    server = createdServer.server;

    request(createdServer.app).get('/settings.json').expect("Content-type",/json/).expect(200).end(function(err, res) {
      if (err) throw err;
    });
  })

  it('error in promise', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await startServer(app, allowedExt, 1, false, 'test/mocks/dist/test-setting-hack', 'test/mocks/things.json');
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(-1);
  })

  it('returns correct types', async () => {
    const createdServer = await startServer(app, allowedExt, 1, false, 'test/mocks/dist/test-setting-hack');
    server = createdServer.server;
    const appReceived = createdServer.app;
    expect(appReceived).toBeTruthy();
    expect(server).toBeTruthy();
  })
})