import { config, setConfig } from "./config"
// import {
//     _handleWindowError,
//     _handleRejectPromise,
//     _handleResourceError,
//     _handleFetchError,
//     _handleAjaxError,
//     _handleConsoleError,
//     _handleConsoleWarnning,
//     _handleVueError,
//     _handleVueWarn,
//     _ThrowError,
//     _ThrowWarn,
//     _ThrowInfo,
// } from "./hooks"
// import  _startRecord  from "./record"

import { _window } from "./redux"


function start(options, extend) {
    if (options) {
        if (extend) {
            options.extends = extend
        }
        setConfig(options)
    }
    if (!config.scriptError) {
        config.filters.push(function () { return /^Script error\.?$/.test(arguments[0]); })
    }
    // 开始录制
    if (config.record) {
        // console.log('=====开始录制轨迹======');
        import("./record").then(result => {
            result.default(_window)
        })
    }
    // 处理过滤器
    if (config.jsError) {
        import("./hooks/js").then(result => {
            result._handleWindowError(_window, config);
            result._handleRejectPromise(_window, config);
            if (config.Vue || config.vue) {
                result._handleVueError(_window, config);
                if (!config.closeWarn)
                    result._handleVueWarn(_window, config)
            }
        })
    }
    if (config.resourceError && addEventListener) {
        import("./hooks/resource").then(result => {
            result._handleResourceError(_window, config);
        })
    }
    if (config.ajaxError) {
        import("./hooks/network").then(result => {
            result._handleFetchError(_window, config);
            result._handleAjaxError(_window, config);
        })
    }
    if (config.custom || config.consoleError) {
        import("./hooks/log").then(result => {
            if (config.custom) {
                _window.fireLog = {
                    error: result._ThrowError(config),
                    warn: result._ThrowWarn(config),
                    info: result._ThrowInfo(config)
                }
            }
            if (config.consoleError) {
                result._handleConsoleError(_window, config);
                if (!config.closeWarn)
                    result._handleConsoleWarnning(_window, config);
            }
        })
    }
    if (!config.closeWarn)
        _window.addEventListener("beforeunload", function () {
            config.sendWarn({}, true)
        })
}

export default start