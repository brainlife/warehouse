
var path = require('path');
var webpack = require('webpack');

var ExtractTextPlugin = require("extract-text-webpack-plugin");

var config = {
    entry: './src/index.jsx',
    output: {
        filename: 'dist/bundle.js'
    },
    plugins: [
        //new webpack.optimize.OccurenceOrderPlugin(),
        //new webpack.HotModuleReplacementPlugin(),
        //new webpack.NoErrorsPlugin()
    ],
    module: {
        loaders: [
            { test: /\.jsx$/, loader: 'babel-loader' },
            { test: /\.css?$/, loaders: ['style', 'raw'] },
        ]
    },
};

module.exports = config;
