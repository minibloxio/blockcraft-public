const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

module.exports = (env, argv) => {
    return {
        entry: './public/src/app.js',
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
            },
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Cross-Origin-Embedder-Policy": "require-corp",
                "Cross-Origin-Opener-Policy": "same-origin"
            }
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                }, {
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
            new webpack.DefinePlugin({ 'DEV_MODE_SKIP_MENUS': argv.mode == 'development' }),
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
            new CopyPlugin({
                patterns: [{ from: "./public/src/workers", to: "./src/workers" }],
            }),
        ],
        resolve: {
            extensions: ['.ts', '.js', '.json']
        }
    };
}
