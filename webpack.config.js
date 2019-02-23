const path = require("path");
const webpack = require('webpack');
const fs = require('fs');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.js'
  },
  resolve: {
    alias: {
      'fs': 'browserfs/dist/shims/fs.js',
      'path': 'browserfs/dist/shims/path.js',
      'bfsGlobal': require.resolve('browserfs')
    }
  },  
  output: {
    path: path.join(__dirname, 'public'),
    publicPath: '/',
    filename: 'tikzjax.js'
  },
  node: {
    Buffer: true
  },
  target: 'web',
  devtool: '#source-map',
  module: {
    noParse: /browserfs\.js/,    
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
      },
      {
        test: /index\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            { search: "'/tex.wasm'", replace: "'/ef253ef29e2f057334f77ead7f06ed8f22607d38.wasm'" },
            { search: "'/core.dump.gz'", replace: "'/7620f557a41f2bf40820e76ba1fd4d89a484859d.gz'" }
          ]
        }
      }      
    ]
  },
  plugins: [
  ]
};
