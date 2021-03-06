const HtmlWebpackPlugin = require("html-webpack-plugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const ESLintPlugin = require("eslint-webpack-plugin");
const path = require("path");
const pckgJson = require("./package.json");

const config = {
  mode: "development",
  stats: {
    children: true,
  },
  plugins: [
    new ESLintPlugin(),
    new HtmlWebpackPlugin({
      inject: "body",
      template: "src/index.html",
    }),
    new WebpackPwaManifest({
      filename: "app.webmanifest",
      fingerprints: false,
      theme_color: "#03456d",
      background_color: "#f6fbff",
      display: "standalone",
      scope: "/",
      start_url: "/",
      name: pckgJson.appName,
      short_name: pckgJson.appName,
      description: pckgJson.description,
      version: pckgJson.version,
      icons: [
        {
          src: path.resolve("src/assets/icon.png"),
          sizes: [72, 96, 128, 144, 152, 192, 256, 384, 512],
        },
      ],
    }),
  ],
  entry: path.resolve(__dirname, "./src/index.js"),
  output: {
    path: path.resolve(__dirname, "./public"),
    filename: "bundle.js",
    publicPath: "/",
    clean: true,
  },
  devServer: {
    static: path.resolve(__dirname, "./public"),
    port: 9000,
    hot: true,
  },
  resolve: {
    extensions: ["*", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  regenerator: true,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          sources: {
            urlFilter: (attribute, value, resourcePath) => {
              if (value.charAt(0) === "/") {
                return false;
              }
              return true;
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: true,
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        exclude: /\.module\.css$/,
      },
    ],
  },
};

module.exports = function (env, argv) {
  if (argv.mode === "production") {
    config.plugins.push(
      new WorkboxWebpackPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
      })
    );
  }
  return config;
};
