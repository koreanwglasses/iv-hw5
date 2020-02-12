const webpack = require('webpack');
const path = require("path");

module.exports = {
    context: __dirname,
    devtool: "inline-sourcemap",
    entry: path.resolve(__dirname, "index.js"),
    output: {
      path: __dirname,
      filename: "bundle.js"
    },
    watch: true,
    plugins: [
    ],
};
