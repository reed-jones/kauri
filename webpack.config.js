const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const path = require('path')
const { NODE_ENV } = process.env
const resolve = dir => path.join(__dirname, dir)
module.exports = {
  mode: ['development', 'production'].includes(NODE_ENV) ? NODE_ENV : 'production',
  resolve: {
    extensions: ['.js', '.ts', '.vue', '.json'],
    alias: {
      // vue$: 'vue/dist/vue.esm.js',
      '@': resolve('./src'),
    },
  },
  target: 'node',
  entry: ['./src/index'],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    publicPath: '/',
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
    ],
  },
}
