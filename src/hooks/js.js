/*监听windows错误*/
function _handleWindowError(_window, config) {
    let _oldWindowError = _window.onerror;
    _window.onerror = function (msg, url, line, col, error) {
        let info = {
            title: url || _window.location.href,
            msg: JSON.stringify(error.stack),
            category: 'js',
            level: "error",
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
                var line = reason.match(/\((\S*)\)/);
                var lineOne = line && line[1]
                var arr = lineOne && lineOne.split(":")
                var length = arr && arr.length;
            }
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(event.reason.stack),
                line: arr && arr[length - 2],
                col: arr && arr[length - 1],
                category: 'js',
                level: "error",
                extends: {}
            });
        }
    }, true);
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
            level: "error",
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
            level: "warning",
            extends: {}
        });

        if (_oldVueWarn && isFunction(_oldVueWarn)) {
            _oldVueWarn.call(this, error, vm, info);
        }
    };
    vue.config.warnHandler = VueWarnHandler
}

export {
    _handleWindowError,
    _handleRejectPromise,
    _handleVueError,
    _handleVueWarn,
}