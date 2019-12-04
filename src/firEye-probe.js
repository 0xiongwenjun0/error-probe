
import { record, Replayer } from 'rrweb'
// import Vue from "vue"

const DIVIDE = "/$##$/"
let self = null
class explorer {
    constructor() {
        this.config = {
            submitUrl: "http://fireye.tdahai.com/api/errors",
            jsError: true,
            resourceError: true,
            ajaxError: true,
            consoleError: false, // console.error默认不处理
            scriptError: false, // 跨域js错误，默认不处理，因为没有任何信息
            vue: true,
            autoReport: true,
            custom: true,//自定义抛出
            closeWarn: false,//是否停止监听Warn
            filters: [], // 过滤器，命中的不上报
            levels: ['info', 'warning', 'error'],
            category: ['js', 'resource', 'ajax', 'log'],
            record: false,//是否录制
            uploadWarnLength: 30,//默认上传的最低长度
            uploadDivide: 30,//警告上传最大延迟（min）
            appId: "",
            appScrect: ""
        };
        this.extend = {};
        self = this;
        this._window = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
        this.addEventListener = this._window.addEventListener || this._window.attachEvent;
        this._window.recordEvent = [];//录制事件
        this._window.eventBackUp = [];//录制时间备份
        this.warnList = [];
        this.FailErrorList = []
        this.defaultInfo = {
            ua: this._window.navigator.userAgent,
            browser: this._getBrowser(),//浏览器
            os: this._getDevices(),//操作系统
            osVersion: this._getSystemVersion(),//操作系统版本
            memery: this._window.navigator.deviceMemory//获取用户的最大内存 G
        }//默认错误信息上报
        this.config.sendError = (error) => {
            /*如果需要录制功能*/
            if (this._window.recordEvent) {
                if (this._window.recordEvent.lenght >= 30) {
                    error.records = this._window.recordEvent;
                } else {
                    error.records = this._window.eventBackUp.concat(this._window.recordEvent);
                }
            }
            //添加默认数据
            for (let i in this.defaultInfo) {
                error[i] = this.defaultInfo[i];
            }
            //添加自定义数据
            if (this.extend) {
                if (!error.extends)
                    error.extends = {}
                let result = this._getExtend(this.extend)
                error.extends = Object.assign(error.extends, result)
            }
            console.log("error", error)
            this._sendToServer(error)
        }
        this.config.sendWarn = (warn, send) => {
            if (!send) {
                //添加默认数据
                for (let i in this.defaultInfo) {
                    warn[i] = this.defaultInfo[i];
                }
                //添加自定义数据
                if (this.extend) {
                    if (!warn.extends)
                        warn.extends = {}
                    let result = this._getExtend(this.extend)
                    warn.extends = Object.assign(warn.extends, result)
                }
                this.warnList.push(warn)
                console.log(this.warnList)
                //判断是否到达上传的长度
                if (this.warnList.length < this.config.uploadWarnLength) {
                    return
                }
            }
            //上报警告信息
            if (this.warnList.length > 0) {
                let arr = this.warnList.map(item => JSON.stringify(item))
                this._sendToServer(arr)
            }
            if (this.FailErrorList.length > 0) {
                this._sendToServer(this.FailErrorList)
            }
        }
        this.config.sendLog = (info) => {
            info.title = this._window.location.href;
            info.category = "log";
            this._sendToServer(info)
        }
    }

    _sendToServer(info) {
        try {
            let isArr = info instanceof Array
            fetch(this.config.submitUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    appId: this.config.appId,
                    appScrect: this.config.appScrect,
                },
                body: isArr ? info : JSON.stringify(info),
            })
                .then(res => {
                    if (isArr) this.warnList = []
                })
                .catch(error => {
                    if (!isArr)
                        this.FailErrorList.push(info)
                });
        }
        catch (e) { }
    }
    _getExtend(extend) {
        if (this.isFunction(extend)) {
            let result = extend()
            if (this.isObject(result))
                return result
            else return {}
        } else if (this.isObject(extend)) {
            for (let key in extend) {
                if (this.isFunction(extend[key])) {
                    extend[key] = extend[key]()
                }
            }
            return extend
        } else {
            return {}
        }
    }

    isObject(what) { return Object.prototype.toString.call(what) === "[object Object]" }
    isFunction(what) { return typeof what === 'function'; }

    /*开始监控*/
    start(options, extend) {
        if (options) {
            for (let i in options) {
                this.config[i] = options[i];
            }
            if(this.config.extend){
                this.extend=this.config.extend
            }
        }

        if (extend) {
            this.extend = extend
        }

        if (!this.config.scriptError) {
            this.config.filters.push(function () { return /^Script error\.?$/.test(arguments[0]); })
        }

        // 开始录制
        if (this.config.record) {
            console.log('=====开始录制错误======');
            this._startRecord();
        }

        // 处理过滤器

        if (this.config.jsError) {
            this._handleWindowError(this._window, this.config);
        }
        if (this.config.jsError) {
            this._handleRejectPromise(this._window, this.config);
        }
        if (this.config.resourceError && addEventListener) {
            this._handleResourceError(this._window, this.config);
        }
        if (this.config.ajaxError) {
            this._handleAjaxError(this._window, this.config);
        }
        if (this.config.consoleError) {
            this._handleConsoleError(this._window, this.config);
            if (!this.config.closeWarn)
                this._handleConsoleWarnning(this._window, this.config);
        }
        if (this.config.vue) {
            this._handleVueError(this._window, this.config);
            if (!this.config.closeWarn)
                this._handleVueWarn(this._window, this.config)
        }
        if (this.config.custom) {
            this._window.fireLog = {
                error: this._ThrowError,
                warn: this._ThrowWarn,
                info: this._ThrowInfo
            }
        }
        this._window.addEventListener("beforeunload", function () {
            this.config.sendWarn({}, true)
        })
    }


    _startRecord() {
        record({
            emit: (event) => {
                /*
                如果事件大于30时，先备份再清空，以防出现错误时，事件过少无法还原错误发生过程，此时可从备份取回部分录制事件
                */
                if (this._window.recordEvent.length >= 100) {
                    this._window.eventBackUp = JSON.parse(JSON.stringify(this._window.recordEvent));
                    this._window.recordEvent = [];
                } else {
                    this._window.recordEvent.push(event);
                }
                // 用任意方式存储 event
            },
        });
    }

    /*监听windows错误*/
    _handleWindowError(_window, config) {
        let _oldWindowError = _window.onerror;
        _window.onerror = function (msg, url, line, col, error) {
            if (error && error.stack) {
                config.sendError({
                    title: url || _window.location.href,
                    msg: JSON.stringify(error.stack),
                    category: 'js',
                    level: 'error',
                    line: line,
                    col: col,
                    extends: {
                        create: "onerror",
                    }
                });
            } else if (typeof msg === 'string') {
                config.sendError({
                    title: url || _window.location.href,
                    msg: JSON.stringify({
                        // info: msg,
                        line: line,
                        col: col
                    }),
                    category: 'js',
                    level: 'error',
                    extends: {
                        create: "onerror",
                    }
                });
            }
            if (_oldWindowError && isFunction(_oldWindowError)) {
                windowError && windowError.apply(window, arguments);
            }
        }
    }

    /*监听Promise Reject错误*/
    _handleRejectPromise(_window, config) {
        _window.addEventListener('unhandledrejection', function (event) {
            if (event) {
                let reason = event.reason;
                config.sendError({
                    title: _window.location.href,
                    msg: JSON.stringify(reason),
                    category: 'js',
                    level: 'error',
                    extends: {
                        create: 'unhandledrejection',
                    }
                });
            }
        }, true);
    };

    /*监听资源错误*/
    _handleResourceError(_window, config) {
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
                    level: 'error',
                    extends: {
                        create: "error Listener",
                        posturl: arguments[0],
                    }
                });
            }
        }, true);
    };

    /*监听fetch请求错误*/
    _handleFetchError(_window, config) {
        if (!_window.fetch) return;
        let _oldFetch = _window.fetch;
        _window.fetch = function () {
            if (!_window.navigator.onLine) {
                console.log("用户已断网")
                return;
            }
            return _oldFetch.apply(this, arguments)
                .then(res => {
                    if (!res.ok) { // True if status is HTTP 2xx
                        if (res.url === config.submitUrl) {
                            console.log('提交错误报错，请检查后台firEye-server是否运行正常');
                        } else {
                            config.sendError({
                                title: _window.location.href,
                                msg: JSON.stringify(res),
                                category: 'ajax',
                                level: 'error',
                                extends: {
                                    create: "fetch check",
                                    posturl: arguments[0],
                                }
                            });
                        }
                    }
                    return res;
                })
                .catch(error => {
                    if (arguments[0] === config.submitUrl)
                        console.log("提交错误报错，请检查后台firEye-server是否运行正常")
                    else
                        config.sendError({
                            title: _window.location.href,
                            msg: JSON.stringify(error),
                            category: 'ajax',
                            level: 'error',
                            extends: {
                                create: "fetch check",
                                posturl: arguments[0],
                            }
                        });
                    throw error;
                })
        }
    };

    /*监听ajax请求错误*/
    _handleAjaxError(_window, config) {
        var protocol = _window.location.protocol;
        if (protocol === 'file:') return;
        // 处理fetch
        this._handleFetchError(_window, config);

        // 处理XMLHttpRequest
        if (!_window.XMLHttpRequest) {
            return;
        }
        let xmlhttp = _window.XMLHttpRequest;

        let _oldSend = xmlhttp.prototype.send;

        let _handleEvent = function (event) {
            if (event && event.currentTarget && event.currentTarget.status !== 200) {
                if (event.target.responseURL === config.submitUrl) {
                    console.log('提交错误报错，请检查后台firEye-server是否运行正常');
                } else {
                    config.sendError({
                        title: _window.location.href,
                        msg: JSON.stringify({
                            response: event.target.response,
                            responseURL: event.target.responseURL,
                            status: event.target.status,
                            statusText: event.target.statusText
                        }),
                        category: 'ajax',
                        level: 'error',
                        extends: {
                            create: "ajax check",
                            posturl: event.target.responseURL,
                        }
                    });
                }

            }
        };

        xmlhttp.prototype.send = function () {
            if (this['addEventListener']) {
                this['addEventListener']('error', _handleEvent);
                this['addEventListener']('load', _handleEvent);
                this['addEventListener']('abort', _handleEvent);
            } else {
                var _oldStateChange = this['onreadystatechange'];
                this['onreadystatechange'] = function (event) {
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
    _handleConsoleError(_window, config) {
        if (!_window.console || !_window.console.error) return;
        let _oldConsoleError = _window.console.error;
        _window.console.error = function () {
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(Array.prototype.join.call(arguments, ',')),
                category: 'js',
                level: 'error',
                extends: {
                    create: "consoleError"
                }
            });
            _oldConsoleError && _oldConsoleError.apply(_window, arguments);
        };
    };

    //处理console warning
    _handleConsoleWarnning(_window, config) {
        if (!_window.console || !_window.console.warn) return;
        let _oldConsoleWarn = _window.console.warn;
        _window.console.warn = function () {
            config.sendWarn({
                title: _window.location.href,
                msg: JSON.stringify(Array.prototype.join.call(arguments, ',')),
                category: 'js',
                level: 'warning',
                extends: {
                    create: "'console warning'",
                }
            });
            _oldConsoleWarn && _oldConsoleWarn.apply(_window, arguments);
        };
    };

    _handleVueError(_window, config) {
        var vue = config.Vue || config.vue || _window.Vue || _window.vue;
        if (!vue || !vue.config) {
            console.log("未找到Vue对象")
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
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(error.stack),
                category: 'js',
                level: 'error',
                extends: {
                    create: 'vue Error',
                    data: metaData,
                }
            });

            if (_oldVueError && isFunction(_oldVueError)) {
                _oldOnError.call(this, error, vm, info);
            }
        };
    };

    _handleVueWarn(_window, config) {
        var vue = config.Vue || config.vue || _window.Vue || _window.vue;
        if (!vue || !vue.config) {
            console.log("未找到Vue对象")
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
                msg: JSON.stringify(msg.stack),
                category: 'js',
                level: 'warning',
                extends: {
                    create: 'vue Warn',
                    data: metaData,
                }
            });

            if (_oldVueWarn && isFunction(_oldVueWarn)) {
                _oldVueWarn.call(this, error, vm, info);
            }
        };
        vue.config.warnHandler = VueWarnHandler
    }

    //自定义抛出错误
    _ThrowError(errInfo, addition) {
        let error = {
            level: "error",
            msg: JSON.stringify(errInfo),
            extends: {
                create: "fireLog Error"
            }
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                error.extends[key] = ex[key]
            }
        }
        self.config.sendLog(error)
    }
    //自定义抛出警告
    _ThrowWarn(warnInfo, addition) {
        let warn = {
            level: "warning",
            msg: JSON.stringify(warnInfo),
            extends: {
                create: "fireLog Error"
            }
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                warn.extends[key] = ex[key]
            }
        }
        self.config.sendLog(warn)
    }
    //自定义抛出普通日志信息
    _ThrowInfo(info, addition) {
        let information = {
            level: "info",
            msg: JSON.stringify(info),
            extends: {
                create: "fireLog Error"
            }
        }
        if (addition) {
            let ex = this._getExtend(addition)
            for (let key in ex) {
                information.extends[key] = ex[key]
            }
        }
        self.config.sendLog(information)
    }

    _getBrowser() {
        var userAgent = navigator.userAgent // 取得浏览器的userAgent字符串
        var isOpera = userAgent.indexOf('Opera') > -1
        if (isOpera) {
            return 'Opera'
        }; // 判断是否Opera浏览器
        if (userAgent.indexOf('Firefox') > -1) {
            return 'FF'
        } // 判断是否Firefox浏览器
        if (userAgent.indexOf('Chrome') > -1) {
            return 'Chrome'
        }
        if (userAgent.indexOf('Safari') > -1) {
            return 'Safari'
        } // 判断是否Safari浏览器
        if (userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera) {
            return 'IE'
        }; // 判断是否IE浏览器
    }

    /**
     获取设备是安卓、IOS  还是PC端
    */
    _getDevices() {
        var u = navigator.userAgent, app = navigator.appVersion
        if (/AppleWebKit.*Mobile/i.test(navigator.userAgent) || (/MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(navigator.userAgent))) {
            if (window.location.href.indexOf('?mobile') < 0) {
                try {
                    if (/iPhone|mac|iPod|iPad/i.test(navigator.userAgent)) {
                        return 'iPhone'
                    } else {
                        return 'Android'
                    }
                } catch (e) { }
            }
        } else if (u.indexOf('iPad') > -1) {
            return 'iPhone'
        } else {
            return 'PC'
        }
    }
    //获取操作系统版本
    _getSystemVersion() {
        var ua = window.navigator.userAgent
        if (ua.indexOf('CPU iPhone OS ') >= 0) {
            return ua.substring(ua.indexOf('CPU iPhone OS ') + 14, ua.indexOf(' like Mac OS X'))
        } else if (ua.indexOf('Android ') >= 0) {
            return ua.substr(ua.indexOf('Android ') + 8, 3)
        } else {
            return 'other'
        }
    }
}



export default new explorer();