const argv = () => {
  const helper = {};
  const argvList = { 
    p: 'PORT of the app, abbreviated', 
    port: 'PORT of the app', 
    d: 'Path to app static files, abbreviated', 
    dir: 'Path to app static files', 
    s: 'Path to the settings file, abbreviated', 
    settings: 'Path to the settings file',
    'allow-routes': 'Use allow-routes serving for routing'
  };

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

    throw new Error('Static Files Path Was not Send');
  };

  helper.helpBehaviour = (argv) => {
    if (argv.h || argv.help) {
      console.log([
        'usage: nodeboot-spa-server [path] [options]',
        '-p --port    Port to use.',
        '-d --dir   Path to the static files.',
        '-s --settings The path to the settings file to use for advanced settings.',
        '--allow-routes The path to the settings file to use for advanced settings.',
      ].join('\n'));
      process.exit(1);
    }
  }
  
  helper.getPort = (argv) => {
    return argv.p || argv.port || process.env.PORT || 8080;
  }

  helper.setSettingsPath = (argv) => {
    return argv.s || argv.settings || undefined;
  }

  return helper;
};

module.exports = argv;