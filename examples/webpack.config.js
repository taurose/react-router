var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

function isDirectory(dir) {
  return fs.lstatSync(dir).isDirectory();
}

var examples = fs.readdirSync(__dirname).filter(function (dir) {
  var isDraft = dir.charAt(0) === '_';
  return !isDraft && isDirectory(path.join(__dirname, dir));
});

var rewrites = examples
  .filter(function(example) {
    return example.indexOf('browser') === 0;
  })
  .map(function (example) {
    return {
      from: new RegExp("^\\/" + example + "\\/"),
      to: function (context) {
        if (context.parsedUrl.pathname.indexOf('.') !== -1) {
          return context.parsedUrl.pathname;
        }

        return example + "/index.html";
      }
    };
  });

console.log(rewrites);

module.exports = {

  devtool: 'inline-source-map',

  entry: examples.reduce(function(entries, dir){
    entries[dir] = path.join(__dirname, dir, 'app.js');
    return entries;
  }, {}),

  output: {
    path: 'examples/__build__',
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    publicPath: '/__build__/'
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' }
    ]
  },

  resolve: {
    alias: {
      'react-router$': process.cwd() + '/modules',
      'react-router/lib': process.cwd() + '/modules'
    }
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('shared.js'),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],

  devServer: {
    historyApiFallback: {
      rewrites: rewrites,
      verbose: true
    }
  }

};
