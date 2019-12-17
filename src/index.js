import { config, setConfig } from "./config"
import {
    _handleWindowError,
    _handleRejectPromise,
    _handleResourceError,
    _handleFetchError,
    _handleAjaxError,
    _handleConsoleError,
    _handleConsoleWarnning,
    _handleVueError,
    _handleVueWarn,
    _ThrowError,
    _ThrowWarn,
    _ThrowInfo,
} from "./hooks"
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
        import("./record").then(res=>res.default())
    }

    // 处理过滤器

    if (config.jsError) {
        _handleWindowError(_window, config);
    }
    if (config.jsError) {
        _handleRejectPromise(_window, config);
    }
    if (config.resourceError && addEventListener) {
        _handleResourceError(_window, config);
    }
    if (config.ajaxError) {
        _handleFetchError(_window, config);
        _handleAjaxError(_window, config);
    }
    if (config.consoleError) {
        _handleConsoleError(_window, config);
        if (!config.closeWarn)
            _handleConsoleWarnning(_window, config);
    }
    if (config.Vue || config.vue) {
        _handleVueError(_window, config);
        if (!config.closeWarn)
            _handleVueWarn(_window, config)
    }
    if (config.custom) {
        _window.fireLog = {
            error: _ThrowError(config),
            warn: _ThrowWarn(config),
            info: _ThrowInfo(config)
        }
    }
    _window.addEventListener("beforeunload", function () {
        config.sendWarn({}, true)
    })
}

export default start