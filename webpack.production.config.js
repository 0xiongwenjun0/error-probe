const DropConsoleWebpackPlugin = require('drop-console-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: __dirname + "/src/index.js", //已多次提及的唯一入口文件
  output: {
    path: __dirname + "/dist", //打包后的文件存放的地方
    filename: "firEye-probe.js", //打包后输出文件的文件名
    libraryTarget: "umd",
    library: "firEye",
    libraryExport: "default" // 增加这个属性
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env"],
            babelrc: false,// 不采用.babelrc的配置
            plugins: [
                "dynamic-import-webpack"
            ]
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          // 删除所有的 `console` 语句，可以兼容ie浏览器
          drop_console: true,
          // 内嵌定义了但是只用到一次的变量
          collapse_vars: true,
          // 提取出出现多次但是没有定义成变量去引用的静态值
          reduce_vars: true,
        },
        output: {
          // 最紧凑的输出
          beautify: false,
          // 删除所有的注释
          comments: false,
        }
      }
    }),
    new DropConsoleWebpackPlugin({
      drop_log: true,
      drop_info: true,
      drop_warn: false,
      drop_error: false,
      exclude: ['manifest'],
    }),
  ]
}
