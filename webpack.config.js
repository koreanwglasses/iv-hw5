const webpack = require('webpack');
const path = require("path");

module.exports = {
    context: __dirname,
    devtool: "inline-sourcemap",
    entry: path.resolve(__dirname, "tsne.js"),
    output: {
      path: __dirname,
      filename: "tsne-bundle.js"
    },
    watch: true,
    plugins: [
    ],
};
