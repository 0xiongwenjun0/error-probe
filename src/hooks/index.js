/*监听windows错误*/
function _handleWindowError(_window, config) {
    let _oldWindowError = _window.onerror;
    _window.onerror = function (msg, url, line, col, error) {
        let info = {
            title: url || _window.location.href,
            msg: JSON.stringify(error.stack),
            category: 'js',
            line: line,
            col: col,
            extends: {}
        }
        if (error && error.stack) {
            info.msg = JSON.stringify(error.stack)
            config.sendError(info);
        } else if (typeof msg === 'string') {
            info.msg = JSON.stringify(msg);
            config.sendError(info);
        }
        if (_oldWindowError && isFunction(_oldWindowError)) {
            windowError && windowError.apply(window, arguments);
        }
    }
}

/*监听Promise Reject错误*/
function _handleRejectPromise(_window, config) {
    _window.addEventListener('unhandledrejection', function (event) {
        if (event) {
            let reason = event.reason.stack
            if (reason) {
                var lineOne = reason.match(/\((\S*)\)/)[1];
                var arr = lineOne.split(":")
                var length = arr.length;
            }
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(event.reason.stack),
                line: reason && arr[length - 2],
                col: reason && arr[length - 1],
                category: 'js',
                extends: {}
            });
        }
    }, true);
};

/*监听资源错误*/
function _handleResourceError(_window, config) {
    _window.addEventListener('error', function (event) {
        if (event) {
            let target = event.target || event.srcElement;
            let isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
            if (!isElementTarget) return; // js error不再处理
            let url = target.src || target.href;
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify({
                    url: url,
                }),
                category: 'resource',
                extends: {}
            });
        }
    }, true);
};

/*监听fetch请求错误*/
function _handleFetchError(_window, config) {
    if (!_window.fetch) return;
    let _oldFetch = _window.fetch;
    _window.fetch = function () {
        let info = {
            title: _window.location.href,
            category: 'ajax',
            extends: {}
        }
        return _oldFetch.apply(this, arguments)
            .then(res => {
                if (!res.ok) { // True if status is HTTP 2xx
                    if (res.url === config.submitUrl) {
                        console.error('提交错误报错，请检查后台firEye-server是否运行正常');
                    } else {
                        info.msg = JSON.stringify(res)
                        config.sendError(info);
                    }
                }
                return res;
            })
            .catch(error => {
                if (arguments[0] === config.submitUrl)
                    console.error("提交错误报错，请检查后台firEye-server是否运行正常")
                else {
                    error.url = arguments[0];
                    info.msg = JSON.stringify(error)
                    config.sendError(info);
                }
                throw error;
            })
    }
};

/*监听ajax请求错误*/
function _handleAjaxError(_window, config) {
    var protocol = _window.location.protocol;
    if (protocol === 'file:') return;
    // 处理XMLHttpRequest
    if (!_window.XMLHttpRequest) {
        return;
    }

    let currentType = null, currentUrl = null;

    let xmlhttp = _window.XMLHttpRequest;

    let _oldOpen = xmlhttp.prototype.open;

    let _oldSend = xmlhttp.prototype.send;

    let _handleEvent = function (event) {
        // console.log(event)
        if (event && event.currentTarget && (event.currentTarget.status < 200 || event.currentTarget >= 400)) {
            if (event.currentTarget.status === 0) {
            }
            else if (event.target.responseURL === config.submitUrl) {
                console.error('提交错误报错，请检查后台firEye-server是否运行正常');
            } else {
                config.sendError({
                    title: _window.location.href,
                    msg: JSON.stringify({
                        response: event.target.response,
                        responseURL: event.target.responseURL,
                        status: event.target.status,
                        statusText: event.target.statusText,
                        type: currentType
                    }),
                    category: 'ajax',
                    extends: {}
                });
            }
        }
    };

    xmlhttp.prototype.open = function (type, url) {
        currentType = type;
        currentUrl = url;
        _oldOpen.apply(this, arguments)
    }

    xmlhttp.prototype.send = function () {
        if (this['addEventListener']) {
            this['addEventListener']('error', _handleEvent);
        } else {
            var _oldStateChange = this['onreadystatechange'];
            this['onreadystatechange'] = function (event) {
                // console.log("ajax状态码", this.readyState)
                if (this.readyState === 4) {
                    _handleEvent(event);
                }
                _oldStateChange && _oldStateChange.apply(this, arguments);
            };
        }
        return _oldSend.apply(this, arguments);
    }
};

/*监听Console 错误*/
function _handleConsoleError(_window, config) {
    if (!_window.console || !_window.console.error) return;
    let _oldConsoleError = _window.console.error;
    _window.console.error = function () {
        config.sendError({
            title: _window.location.href,
            msg: Array.prototype.join.call(arguments, ','),
            category: 'js',

            extends: {}
        });
        _oldConsoleError && _oldConsoleError.apply(_window, arguments);
    };
};

//处理console warning
function _handleConsoleWarnning(_window, config) {
    if (!_window.console || !_window.console.warn) return;
    let _oldConsoleWarn = _window.console.warn;
    _window.console.warn = function () {
        config.sendWarn({
            title: _window.location.href,
            msg: JSON.stringify(Array.prototype.join.call(arguments, ',')),
            category: 'js',
            extends: {}
        });
        _oldConsoleWarn && _oldConsoleWarn.apply(_window, arguments);
    };
};

function _handleVueError(_window, config) {
    var vue = config.Vue || config.vue || _window.Vue || _window.vue;
    if (!vue || !vue.config) {
        // console.log("未找到Vue对象")
        return; // 没有找到vue实例
    }
    var _oldVueError = vue.config.errorHandler;
    vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
        let metaData = {}
        if (Object.prototype.toString.call(vm) === '[object Object]') {
            metaData.componentName = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
            metaData.propsData = vm.$options.propsData;
        }
        console.error(error)
        metaData.stack = error.stack;
        metaData.message = error.message;
        if (error.stack) {
            var lineOne = error.stack.match(/\((\S*)\)/)[1];
            var arr = lineOne.split(":")
            var length = arr.length;
        }
        config.sendError({
            title: _window.location.href,
            msg: JSON.stringify(error.stack),
            line: error.stack && arr[length - 2],
            col: error.stack && arr[length - 1],
            category: 'js',

            extends: {}
        });

        if (_oldVueError && isFunction(_oldVueError)) {
            _oldOnError.call(this, error, vm, info);
        }
    };
};

function _handleVueWarn(_window, config) {
    var vue = config.Vue || config.vue || _window.Vue || _window.vue;
    if (!vue || !vue.config) {
        // console.log("未找到Vue对象")
        return
    } // 没有找到vue实例
    var _oldVueWarn = vue.config.warnHandler
    function VueWarnHandler(msg, vm, info) {
        var metaData = {};
        if (Object.prototype.toString.call(vm) === '[object Object]') {
            metaData.componentName = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
            metaData.propsData = vm.$options.propsData;
        }
        console.warn(msg)
        metaData.stack = msg.stack;
        metaData.message = msg.message;
        config.sendWarn({
            title: _window.location.href,
            msg: JSON.stringify(msg),
            category: 'js',
            extends: {}
        });

        if (_oldVueWarn && isFunction(_oldVueWarn)) {
            _oldVueWarn.call(this, error, vm, info);
        }
    };
    vue.config.warnHandler = VueWarnHandler
}

//自定义抛出错误
function _ThrowError(config) {
    return function (errInfo, addition) {
        let error = {
            level: "error",
            msg: JSON.stringify(errInfo),
            extends: {}
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                error.extends[key] = ex[key]
            }
        }
        config.sendLog(error)
    }
}
//自定义抛出警告
function _ThrowWarn(config) {
    return function (warnInfo, addition) {
        let warn = {
            level: "warning",
            msg: JSON.stringify(warnInfo),
            extends: {}
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                warn.extends[key] = ex[key]
            }
        }
        config.sendLog(warn)
    }
}
//自定义抛出普通日志信息
function _ThrowInfo(config) {
    return function (info, addition) {
        let information = {
            level: "info",
            msg: JSON.stringify(info),
            extends: {}
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                information.extends[key] = ex[key]
            }
        }
        config.sendLog(information)
    }
}

export {
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
}