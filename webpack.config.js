const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = {
    entry: './public/javascripts/app.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 3001,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3002',
                ws: true
            }
        }
    },
    module: {
        rules: [{
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {

            test: /\.(png|otf)$/,
            type: 'asset/resource'

        }
        ],
    },
    plugins: [
        new FaviconsWebpackPlugin('./public/assets/favicon.png'),
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            filename: "index.html",
            path: path.resolve(__dirname, 'dist'),
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
        new CopyPlugin({
            patterns: [{ from: "./public/textures", to: "./textures" }],
        }),
    ],

};