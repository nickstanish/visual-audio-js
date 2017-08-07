const webpack = require("webpack");
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const webpackConfig = {
  devtool: 'source-map',
  entry: [
    './node_modules/webpack/hot/dev-server.js',
    "./src/javascripts/main.js"
  ],
  output: {
    libraryTarget: 'umd',
    path: "./public",
    publicPath: "public",
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
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(new Date())
      })
   ],
  devServer: {
    port: 3000,
    historyApiFallback: {
      index: 'index.html'
    }
  }
};

module.exports = webpackConfig;
