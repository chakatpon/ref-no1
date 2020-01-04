const withCss = require("@zeit/next-css");
const webpack = require("webpack");
const withSass = require("@zeit/next-sass");
let assetPrefix = process.env.APP_DOMAIN || "";
assetPrefix += process.env.APP_PATH || "/";
module.exports = withCss(
  withSass({
    assetPrefix,
    cssModules: true,
    cssLoaderOptions: {
      importLoaders: 1,
      localIdentName: "[local]"
    },
    publicRuntimeConfig: {
      localeSubpaths:
        typeof process.env.LOCALE_SUBPATHS === "string"
          ? process.env.LOCALE_SUBPATHS
          : "none"
    },
    webpack(config, { dev }) {
      config.plugins.push(
        // new Dotenv(),
        new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery",
          Popper: "popper.js"
        })
      );
      return config;
    }
  })
);
