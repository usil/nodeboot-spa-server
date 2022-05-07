# nodeboot-spa-server

<img src="./coverage/badge-branches.svg">
<img src="./coverage/badge-functions.svg">
<img src="./coverage/badge-lines.svg">
<img src="./coverage/badge-statements.svg">

simple http server for any spa developed with react, angular, vue, etc with some few useful features

## Features

- server for statics assets like: index.html, main.css, etc
- **/settings.json** http endpoint ready to use to load variables at startup of spa and have one build for any environment

## Requirements

- nodejs >= 10

## Usage

If you have the result of your spa build, you just need install this server

```cmd
npm install https://github.com/usil/nodeboot-spa-server.git
```

Add this script to you package.json

```json
"start" : "nodeboot-spa-server my-folder"
```

Where **my-folder** is the folder where your build assets are created:

- Builds for angular & vue are created in
  - dist
- Builds for react are created in
  - build

> note: since angular 12, a folder with name of project is created inside dist folder. In this case use:

```json
"start" : "nodeboot-spa-server dist/acme"
```

If you are using another framework, just set any folder that you need. This folder should be in the default workspace and at least contain the classic **index.html**

## Parameters

| parameter        | description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| -p               | port of the server. Default 8080. Long: -port                                |
| -d               | folder with assets of build operation: index.html, etc. Long: -dir           |
| -s               | path of file with variables in json format. Long: -settings                  |
| --allow-routes   | used for angular or any spa which hits the server for html instead pure ajax |
| --https          | use https for sessions                                                       |
| --oauth2         | activate oauth2                                                              |
| --serverSettings | the settings that are only for the spa server part                           |

Use `nodeboot-spa-server -h` to show the list in the shell.

Here an example for angular, with variables in config.json, port 9000 and allowed routes

```json
"start": "nodeboot-spa-server dist -s config.json -p 9000 --allow-routes | bunyan",
```

## What is /settings.json ?

Read [this](https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/) in section "The Limitations.." to understand why all the SPAs(angular, react, vue, etc) needs a build for any environment.

In short, all the spas, have hardcoded the required variables inside of the minified and compressed javascript file which is created with `npm run build`:

- .env
- environment.prod.ts
- hardcoded values in constants.js, config.js

That means that if one build was tested for Q&A team, another build is required to production, because if we deploy the same build on the production environment, our spa will continue pointing to testing urls. Common solution is **build again** the spa with some variable like

- --prod
- env=prod
- .env.prod
- etc

**How we solve this?**

- What if your spa don't need the internal static variables (environment.ts, REACT*APP*, etc)?
- How your spa knows what is the testing http endpoint of employees microservice?

**Solution:** Load the settings of the spa at the start of spa, consuming an http endpoint which returns a json with your required variables. Then just expose them to the rest of your spa modules, classes, etc

This framework exposes an http endpoint ready to use at the same domain of the spa. This means that if your deploy your spa at **acme.com** your settings will be **acme.com/settings.json**.

Values are read from environment variables, exactly like [create-react-app](https://create-react-app.dev/docs/adding-custom-environment-variables/) but for general purpose.

Just export some variables with prefix: **SPA*VAR***

```cmd
export SPA_VAR_FOO=foo_value
export SPA_VAR_employeeApiBaseUrl=https://employee-api.com
```

Then in your spa, **at the beginning**, you could consume this http endpoint **/settings.json** with ajax in order to get your variables:

```
{
 "FOO" : "foo_value",
 "employeeApiBaseUrl" : "https://employee-api.com"
}
```

Then the result could be exposed to the entire spa with:

- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- some global variable like `global._settings`
- some javascript module or class
- store or another advanced approach

## /settings.json advanced

Instead of prefix your variables with **SPA*VAR***, inspired on the [java spring boot framework](https://stackoverflow.com/a/35535138/3957754), you could create a **settings.json** file at the root with these values:

```json
{
  "foo": "bar",
  "employeeApiBaseUrl": "${EMPLOYEE_API_BASE_URL}"
}
```

Just ensure that that variable exist before the start of server:

```txt
#linux
export EMPLOYEE_API_BASE_URL=https://employee-api.com

#windows
set EMPLOYEE_API_BASE_URL=https://employee-api.com
```

Add the **-s settings.json** parameter:

```json
"start": "nodeboot-spa-server dist -s settings.json -p 9000 --allow-routes | bunyan",
```

Then start the spa server `npm run start` and this framework, will evaluate the variable syntax and expose you this json:

```json
{
  "foo": "bar",
  "employeeApiBaseUrl": "https://employee-api.com"
}
```

## Logger

In this project the logger Bunyan is used.

## Adding oauth2

Start your spa with `nodeboot-spa-server dist/template-dashboard -s settings.json --serverSettings server-settings.json -p 8080 --allow-routes --oauth2 | bunyan`.

### Oauth2 settings with a home page

The auth information result is showed in the `settings.json` end point with `signedUserDetails`.

You should enter the success page where it will go after the successfully login.

You need to create a `server-settings.json` file with the following variables:

```json
{
  "cookieMaxAge": 60000,
  "loginPage": "/login",
  "errorPage": "/error",
  "successPage": "/success",
  "publicPages": [],
  "applicationIdentifier": "web1",
  "oauth2TimerRefreshInterval": "${SECURITY_OAUTH2_TIME_INTERVAL}",
  "oauth2RefreshTokenUrl": "${SECURITY_OAUTH2_REFRESH_TOKEN_URL}",
  "oauth2ClientId": "${OAUTH2_CLIENT_ID}",
  "sessionSecret": "${SESSION_SECRET}",
  "oauth2BaseUrl": "${SECURITY_OAUTH2_BASE_URL}",
  "oauth2TokenUserEndpoint": "${SECURITY_OAUTH2_TOKEN_USER_URL}",
  "oauth2AuthorizeUrl": "${SECURITY_OAUTH2_AUTHORIZE_URL}"
}
```

### Added end points for oauth2

| Endpoint       | Method | Description         |
| -------------- | ------ | ------------------- |
| /oauth2/logout | GET    | Closes the session  |
| /oauth2/login  | GET    | Creates the session |

### Oauth2 settings no home page

Any request to any end point will activate the automatic login. Just do not include the login page.

You need to create a `server-settings.json` file with the following variables:

```json
{
  "cookieMaxAge": 60000,
  "errorPage": "/error",
  "successPage": "/success",
  "oauth2ClientId": "${OAUTH2_CLIENT_ID}",
  "sessionSecret": "${SESSION_SECRET}",
  "oauth2BaseUrl": "${SECURITY_OAUTH2_BASE_URL}",
  "oauth2CallbackProcessor": "${SECURITY_OAUTH2_CALLBACK_PROCESSOR}",
  "oauth2AuthorizeUrl": "${SECURITY_OAUTH2_AUTHORIZE_URL}"
}
```

## /settings.json at developer stage

The previous paragraphs showed how use spa server for production environment (npm run build and npm run start) but what happen in the local developer workspace?

Follow these steps to configure a /settings.json at developer stage:

- Install the [advanced settings package](https://github.com/nodeboot/advanced-settings):

`npm install https://github.com/nodeboot/advanced-settings --save-dev`

- Add a settings.json file in the root. For more info about this file take a look at https://github.com/nodeboot/advanced-settings/blob/main/README.md. You could use syntax variable ${VAR} in this file:

```json
{
  "serviceUrl": "http://acme-api.com"
}
```

Specific configurations by framework:

- Angular 12 & 13
- https://github.com/usil/nodeboot-spa-server/wiki/Dev-Mode-:-Angular-12

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
