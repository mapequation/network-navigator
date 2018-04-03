const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/js'),
    },
    devtool: 'source-map',
    watch: true,
    watchOptions: {
        ignored: /node_modules/,
    },
    resolve: {
        alias: {
            d3: 'd3/dist/d3.js',
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre',
            },
        ],
    },
};
