var HtmlWebpackPlugin =require('html-webpack-plugin');
var PATH = require('path')
module.exports = {
    entry:  __dirname + "/src/index.js",//已多次提及的唯一入口文件
    output: {
        path: __dirname + "/dist",//打包后的文件存放的地方
        filename: "firEye-probe.js"//打包后输出文件的文件名
    },
    devServer: {
      contentBase: PATH.join(__dirname, "dist"),
      port: 9000
    },
    devtool:"hidden-source-map",
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "env",
                        ]
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: 'head',
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        })
    ]
};