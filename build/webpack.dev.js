const { merge } = require("webpack-merge");
const base = require("./webpack.base");
const webpack = require("webpack");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const chalk = require("chalk");

const POST = 8889;

// 取本机IP地址
const getIPAdress = () => {
  var interfaces = require("os").networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        conlg.push(
          chalk.blueBright.bold("Your application is running here: ") +
            chalk.greenBright.bold(`http://${alias.address}:${port}/`)
        );
      }
    }
  }
};

let conlg = [];
getIPAdress();
conlg.push(
  chalk.blueBright.bold("Your application is running here: ") +
    chalk.greenBright.bold(`http://localhost:${port}/`)
);

module.exports = merge(base, {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  plugins: [
    new webpack.DefinePlugin({
      process: {
        env: {
          NODE_DEV: JSON.stringify("development"),
          // 这里可以定义你的环境变量
          // VUE_APP_URL: JSON.stringify('https://xxx.com')
        },
      },
    }),
    new webpack.HotModuleReplacementPlugin(),
    new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: conlg,
      },
    }),
  ],
  stats: "errors-only",
  devServer: {
    host: "0.0.0.0",
    port: POST,
    open: false,
    hot: true,
    // 设置代理，用来解决本地开发跨域问题，如果设置了代理，那你本地开发环境的axios的baseUrl要写为 '' ，即空字符串
    proxy: {},
  },
});
