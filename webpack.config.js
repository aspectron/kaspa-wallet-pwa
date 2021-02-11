const path = require('path');
const root = __dirname;
const webpack = require("webpack");
//console.log("webpack.optimize.DedupePlugin", webpack)

module.exports = {
  entry: {
    //'kaspa-wallet-worker': './http/kaspa-wallet-worker.js',
    //'kaspa-wallet':'./http/kaspa-wallet.js'
    'wallet-app': './http/wallet-app.js',
    'kaspa-wallet-worker-core': './http/kaspa-wallet-worker-core.js'
  },
  //mode: "production",
  mode: "development",
  /*watch: true,*/
  /*externals_:{
    "/style/style___.js": "/style/style.js",
    "/flow/flow-ux/flow-ux.js": "/flow/flow-ux/flow-ux.js",
    "/kaspa-ux/kaspa-ux.js": "/kaspa-ux/kaspa-ux.js"
  },*/
  resolve: {
    //importsFields: ["browser"],
    //aliasFields: ['browser'],
    alias:{
      "/style/style.js": "/http/style/style.js",
      "/flow/flow-ux/flow-ux.js": path.join(root, "node_modules/@aspectron/flow-ux/flow-ux.js"),
      "/@kaspa/ux/kaspa-ux.js": path.join(root, "node_modules/@kaspa/ux/kaspa-ux.js"),
      "/@kaspa/grpc-web": path.join(root, "./node_modules/@kaspa/grpc-web"),
      "@aspectron/flow-grpc-web": path.join(root, "./node_modules/@aspectron/flow-grpc-web"),
      //"kaspa-wallet-worker": "../kaspa-wallet-worker",
      //"/kaspa-wallet-worker/kaspa-wallet-worker.js": "../kaspa-wallet-worker/kaspa-wallet-worker.js"
    },
  	fallback: {
  		"path": false,
      "fs": false,
      "Buffer": require.resolve("buffer/"),
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "assert": require.resolve("assert/"),
      "process": require.resolve("process/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "os": false,
      "nw.gui": false,
      "@kaspa/wallet-worker": require.resolve("./node_modules/@kaspa/wallet-worker")
  	}
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    //library:'_LIB',
    //libraryTarget: "var"
  },
  module: {
    /*rules: [
      // JavaScript / ES6
      {
        test: /\.js?$/,
        //include: path.resolve(__dirname, "../src"),
        use: "babel-loader"
      }
     ]*/
  },
  plugins:[
    //new webpack.optimize.DedupePlugin()
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    })
  ],
  stats:{
    //errorDetails:true,
    env:true
  }
}