module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine', 'requirejs'],
    files: [
      'main.js',
      {
        pattern: 'node_modules/jquery/dist/jquery.min.js',
        included: false
      },
      {
        pattern: 'node_modules/moment/min/moment.min.js',
        included: false
      },
      {pattern: 'spec/*.js', included: false}, // this is where are your specs, please do not include them!
      {pattern: './opening-hours.js', included: false} // this is where are your source files, please do not include them!
    ],
    exclude: [],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],
    singleRun: true
  })
};
