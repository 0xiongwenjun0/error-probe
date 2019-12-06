module.exports = {
  entry: __dirname + "/src/firEye-probe.js", //已多次提及的唯一入口文件
  output: {
    path: __dirname + "/lib", //打包后的文件存放的地方
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
            presets: ["env"]
          }
        },
        exclude: /node_modules/
      }
    ]
  }
}
