const processArgv = () => {
  const helper = {};

  helper.getStaticDirName = (argv) => {
    if (argv.d) {
      return argv.d;
    }
    if (argv.dir) {
      return argv.dir;
    }
    if (argv._[0]) {
      return argv._[0];
    }

    throw new Error("Static Files Path Was not Send");
  };

  helper.helpBehavior = (argv) => {
    if (argv.h || argv.help) {
      console.log(
        [
          "usage: nodeboot-spa-server [path] [options]",
          "-p --port    Port to use.",
          "-d --dir   Path to the static files.",
          "-s --settings The path to the settings file to use for advanced settings.",
          "--allow-routes The path to the settings file to use for advanced settings.",
          "--oauth2 Use oauth2",
        ].join("\n")
      );
      process.exit(1);
    }
  };

  helper.getPort = (argv) => {
    return argv.p || argv.port || process.env.PORT || 8080;
  };

  helper.setSettingsPath = (argv) => {
    return argv.s || argv.settings || undefined;
  };

  helper.setServerSettingsPath = (argv) => {
    return argv.serverSettings || undefined;
  };

  helper.useHttps = (argv) => {
    return argv.https ? true : false;
  };

  return helper;
};

module.exports = processArgv;
