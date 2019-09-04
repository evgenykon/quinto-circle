const webpack = require('webpack');
//const CompressionPlugin = require('compression-webpack-plugin');


var config = {
    entry: {
        script: './index.js',
     },
     output: {
        path: __dirname + '/dist/',
        filename: '[name].js',
        publicPath: 'dist/'
    },
    module: {
        rules: [
          {        
            test: /\.js$/,
            exclude: /node_modules/,        
            loader: "babel-loader"
          }
        ]
    },
    plugins: [
        //new CompressionPlugin()
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/](chart.js)[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                }
            }
        }
    }
}

module.exports = config;
