var webpack = require("webpack");
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var webpackConfig = {
  devtool: 'source-map',
  entry: [
    "./src/javascripts/main.js"
  ],
  output: {
    libraryTarget: 'umd',
    path: "./public",
    filename: "js/visual-audio.js"
  },
  stats: {
    colors: true
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ["src/javascripts", "src/shaders", "src", "node_modules"]
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /.less$/,
        loader: ExtractTextPlugin.extract('style?sourceMap', '!css?sourceMap!less?sourceMap')
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('css/styles.css'),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(new Date())
    })
  ]
};

module.exports = webpackConfig;
