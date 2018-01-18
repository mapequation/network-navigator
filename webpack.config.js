const path = require('path');

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/js'),
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/,
    },
    resolve: {
        alias: {
            d3: 'd3/build/d3.js',
        },
        modules: [
            path.resolve('./src'),
            path.resolve('./node_modules'),
        ],
    },
};
