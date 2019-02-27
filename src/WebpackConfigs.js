import webpack from 'webpack'
import VueLoaderPlugin from 'vue-loader/lib/plugin';

const hmr = {
    mode: 'development',

    // enable watcher
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },

    // add hot reload
    entry: ['webpack-hot-middleware/client?reload=true&timeout=10000&name=app'],

    // hot reload file output location
    output: {
        hotUpdateChunkFilename: '.hot-cache/[id].[hash].hot-update.js',
        hotUpdateMainFilename: '.hot-cache/[hash].hot-update.json'
    },

    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ]
};

const vue = {
    target: ['web'],
    resolve: {
        extensions: ['.js', '.vue', '.json'],
    },
    // setup our loaders
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },

            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'postcss-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            // you can also read from a file, e.g. `variables.scss`
                            data: `$white: #fff;`
                        }
                    }
                ]
            },
            {
                test: /\.styl(us)?$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'postcss-loader',
                    'stylus-loader'
                ]
            },
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader', 'postcss-loader']
            },
            {
                test: /\.pug$/,
                oneOf: [
                    // this applies to `<template lang="pug">` in Vue components
                    {
                        resourceQuery: /^\?vue/,
                        use: ['pug-plain-loader']
                    },
                    // this applies to pug imports inside JavaScript
                    {
                        use: ['raw-loader', 'pug-plain-loader']
                    }
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'img/[name].[hash:7].[ext]'
                }
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'media/[name].[hash:7].[ext]'
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'fonts/[name].[hash:7].[ext]'
                }
            }
        ]
    },
    plugins: [new VueLoaderPlugin()]
};

export const ClientWebpack = {
    hmr,
    vue
};

export const ServerWebpack = {}
