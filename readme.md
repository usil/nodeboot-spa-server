# nodeboot-spa-server

<img src="./coverage/badge-branches.svg">
<img src="./coverage/badge-functions.svg">
<img src="./coverage/badge-lines.svg">
<img src="./coverage/badge-statements.svg">


http server for any spa developed with react, angular, vue, etc with some few useful features

## Requirements

- nodejs >= 10

## Usage

If you have the result of your spa build, you just need install this server

``` cmd
npm install nodeboot-spa-server --save
```

Add this script to you package.json

``` json
"start" : "nodeboot-spa-server dist"
```

Where dist is the folder where your build assets were created:

- angular and vue
  - dist
- react
  - build

If you are using another framework, just set any folder that you need. This folder should be in the default workspace  

## Options

Use `nodeboot-spa-server -h` to show the list.

``` text
    p: 'PORT of the app, abbreviated', 
    port: 'PORT of the app', 
    d: 'Path to app static files, abbreviated', 
    dir: 'Path to app static files', 
    s: 'Path to the settings file, abbreviated', 
    settings: 'Path to the settings file',
    allow-routes: 'Use allow-routes serving for routing'
```

## Features

### /settings.json

Read [this](https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/) in section "The Limitations.." to understand why all the SPAs(angular, react, vue, etc) needs a build for any environment. I mean if one build was tested for Q&A team, another build is required to production.

**How we solve this?**
Get your settings from an http endpoint which is exposed by this framework, ready to use. Values are from environment variables, exactly like [create-react-app](https://create-react-app.dev/docs/adding-custom-environment-variables/) but for general purpose.

Just export some variables with prefix: **SPA_VAR_**

``` cmd
export SPA_VAR_FOO=foo_value
export SPA_VAR_BAR=bar_value
```

Then in your spa, **at the beginning**, you could consume this get endpoint with ajax in order to get your settings, instead

- .env
- environment.prod.ts
- hardcoded values in constants.js, config.js

Then the result could be exposed to the entire spa with:

- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- some global variable like `global._settings`
- some javascript module or class
- store or another advanced approach

## General Steps To Work Locally With a Spa Framework

- Install the [advanced settings package](https://github.com/nodeboot/advanced-settings): `npm install https://github.com/nodeboot/advanced-settings --save-dev`

- Create a `settings.json` file

## Angular Guide (Angular 12)

This guide was created in Angular 12 but as of november 9 2021 it should now work also on Angular 13, only replace `@angular-builders/custom-webpack@12.1.3` with `@angular-builders/custom-webpack`.

1. First create a new project: `ng new <project-name>`.
2. Then run: `npm i -D @angular-builders/custom-webpack@12.1.3`.
3. Run: `npm install https://github.com/nodeboot/advanced-settings --save-dev`
4. Create a `custom-webpack.config.js`:.

``` javascript
const EnvSettings = require('advanced-settings').EnvSettings;
const envSettings = new EnvSettings();

const options = {
  devServer: {
    before: (devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      devServer.get('/settings.json', function (req, res) {
        const settings = envSettings.loadJsonFileSync('./settings.json');
        res.json(settings);
      });
    },
  },
}

module.exports = options;
```

5. In your `angular.json` file add/replace:

``` json
"architect": {

        "build": {
            "builder": "@angular-builders/custom-webpack:browser",
        },
        "options": {
            "customWebpackConfig": {
                "path": "./custom-webpack.config.js"
            }
        },
}
```

``` json
"serve": {
      "options": {
          "browserTarget": "build"
      },
      "builder": "@angular-builders/custom-webpack:dev-server",
}
```

6. Modify your main.ts to look like:

``` typescript
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

fetch('/settings.json')
  .then((response) => response.json())
  .then((config) => {
    if (environment.production) {
      enableProdMode();
    }

    environment.url = config.serviceUrl;

    platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));

  }).catch(error => {
    console.log(error);

    platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
  })
```

7. Add a `settings.json` file in the root. For more info about this file take a look at <https://github.com/nodeboot/advanced-settings/blob/main/README.md>

``` json
{
  "serviceUrl": "http33ed",
}
```

8. Finally modify your package.json scripts to look like:

```json
  "scripts": {
    "ng": "ng",
    "dev": "ng serve",
    "start": "nodeboot-spa-server dist/test-setting-hack -s settings.json -p 2000 --allow-routes",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
```

## License

[MIT](./LICENSE)

## Contributors

<table>
  <tbody>
    <td>
      <img src="https://avatars0.githubusercontent.com/u/3322836?s=460&v=4" width="100px;"/>
      <br />
      <label><a href="http://jrichardsz.github.io/">JRichardsz</a></label>
      <br />
    </td>
    <td>
      <img src="https://i.ibb.co/88Tp6n5/Recurso-7.png" width="100px;"/>
      <br />
      <label><a href="https://github.com/TacEtarip">Luis Huertas</a></label>
      <br />
    </td>
  </tbody>
</table>
