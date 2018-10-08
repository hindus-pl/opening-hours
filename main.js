var deps = [];

Object.keys( window.__karma__.files ).forEach( function ( file ) {
  if ( /(spec|test)\.js$/i.test( file ) ) {
    deps.push( file );
  }
} );

require.config( {
  baseUrl: '/base/',
  paths: {
    jquery: 'node_modules/jquery/dist/jquery.min',
    moment: 'node_modules/moment/min/moment.min'
  },
  deps: deps,
  callback: window.__karma__.start
} );
