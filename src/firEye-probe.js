
import { record, Replayer } from 'rrweb'
const DIVIDE = "/$##$/"
let self=null
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
            filters: [], // 过滤器，命中的不上报
            levels: ['info', 'warning', 'error'],
            category: ['js', 'resource', 'network', 'log'],
            record: false,//是否录制
            uploadLength: 30,//默认上传的最低长度
            appId: "",
            appScrect: ""
        };
        this.extend = {};
        self=this;
        this._window = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
        this.addEventListener = this._window.addEventListener || this._window.attachEvent;
        this._window.recordEvent = [];//录制事件
        this._window.eventBackUp = [];//录制时间备份
        this.warnList = [];
        this.defaultInfo = {
            ua: this._window.navigator.userAgent,
            browser: this.getBrowser(),//浏览器
            os: this.getDevices(),//操作系统
            osVersion: this.getSystemVersion(),//操作系统版本
        }//默认错误信息上报
        this.config.sendError = (error) => {
            this.sendToServer(error, "error")
        }
        this.config.sendWarn = (warn) => {
            this.sendToServer(error, "warning")
        }
    }

    sendToServer(info, level = "error") {
        if (level === "error") {
            /*如果需要录制功能*/
            if (this._window.recordEvent) {
                if (this._window.recordEvent.lenght >= 30) {
                    info.records = this._window.recordEvent;
                } else {
                    info.records = this._window.eventBackUp.concat(this._window.recordEvent);
                }
            }
            for (let i in this.defaultInfo) {
                info[i] = this.defaultInfo[i];
            }
            if(this.extend){
                for(let key in this.extend){
                    info[key]=this.isFunction(this.extend[key])?this.extend[key]():this.extend[key]
                }
            }
            // error.network
        } else if (level = "warning") {
            this.warnList.push(info)
            if (this.warnList.length < this.config.uploadLength) {
                return
            }
            //上报警告信息
            info = {
                arr: this.warnList.map(item => JSON.stringify(item)).join(DIVIDE)
            }
        }
        try {
            fetch(this.config.submitUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    appId: this.config.appId,
                    appScrect: this.config.appScrect,
                },
                body: JSON.stringify(info),
            }).then(res => {
                // console.log(res)
            })
                .catch(error => console.error('Error:', error));
        }
        catch (e) { }
    }

    isFunction(what) { return typeof what === 'function'; }

    /*开始监控*/
    start(options, errorInfo) {
        if (options) {
            for (let i in options) {
                this.config[i] = options[i];
            }
        }

        if (errorInfo) {
            this.extend = errorInfo
        }

        if (!this.config.scriptError) {
            this.config.filters.push(function () { return /^Script error\.?$/.test(arguments[0]); })
        }

        // 开始录制
        if (this.config.record) {
            console.log('=====开始录制错误======');
            this.startRecord();
        }

        // 处理过滤器

        if (this.config.jsError) {
            this.handleWindowError(this._window, this.config);
        }
        if (this.config.jsError) {
            this.handleRejectPromise(this._window, this.config);
        }
        if (this.config.resourceError && addEventListener) {
            this.handleResourceError(this._window, this.config);
        }
        if (this.config.ajaxError) {
            this.handleAjaxError(this._window, this.config);
        }
        if (this.config.consoleError) {
            this.handleConsoleError(this._window, this.config);
            this.handleConsoleWarnning(this._window, this.config);
        }
        if (this.config.vue) {
            this.handleVueError(this._window, this.config);
            this.handleVueWarn(this._window, this.config)
        }
        if (this.config.custom) {
            this._window.ThrowError = this.ThrowError
        }
    }


    startRecord() {
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
    handleWindowError(_window, config) {
        let _oldWindowError = _window.onerror;
        _window.onerror = function (msg, url, line, col, error) {
            if (error && error.stack) {
                config.sendError({
                    title: url || _window.location.href,
                    msg: error.stack,
                    category: 'js',
                    level: 'error',
                    create: "window.onerror",
                    line: line,
                    col: col,
                });
            } else if (typeof msg === 'string') {
                config.sendError({
                    title: url || _window.location.href,
                    msg: JSON.stringify({
                        info: msg,
                        line: line,
                        col: col
                    }),
                    category: 'js',
                    level: 'error',
                    create: "onerror",
                });
            }
            if (_oldWindowError && isFunction(_oldWindowError)) {
                windowError && windowError.apply(window, arguments);
            }
        }
    }

    /*监听Promise Reject错误*/
    handleRejectPromise(_window, config) {
        _window.addEventListener('unhandledrejection', function (event) {
            if (event) {
                let reason = event.reason;
                config.sendError({
                    title: _window.location.href,
                    msg: reason,
                    category: 'js',
                    create: 'unhandledrejection',
                    level: 'error',
                });
            }
        }, true);
    };

    /*监听资源错误*/
    handleResourceError(_window, config) {
        _window.addEventListener('error', function (event) {
            if (event) {
                let target = event.target || event.srcElement;
                let isElementTarget = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement || target instanceof HTMLImageElement;
                if (!isElementTarget) return; // js error不再处理
                let url = target.src || target.href;
                config.sendError({
                    title: _window.location.href,
                    info: target.nodeName,
                    msg: JSON.stringify({
                        url: url,
                    }),
                    category: 'resource',
                    level: 'error',
                    create: "error Listener"
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
                            console.log('提交错误报错，请检查后台frontend-sniper-server是否运行正常');
                        } else {
                            config.sendError({
                                title: _window.location.href,
                                posturl: arguments[0],
                                msg: JSON.stringify(res),
                                category: 'network',
                                level: 'error',
                                create: "fetch check",
                            });
                        }
                    }
                    return res;
                })
                .catch(error => {
                    config.sendError({
                        title: _window.location.href,
                        posturl: arguments[0],
                        msg: error,
                        category: 'network',
                        level: 'error',
                        create: "fetch check",
                    });
                    throw error;
                })
        }
    };

    /*监听ajax请求错误*/
    handleAjaxError(_window, config) {
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
                    console.log('提交错误报错，请检查后台frontend-sniper-server是否运行正常');
                } else {
                    config.sendError({
                        title: _window.location.href,
                        posturl: event.target.responseURL,
                        msg: JSON.stringify({
                            response: event.target.response,
                            responseURL: event.target.responseURL,
                            status: event.target.status,
                            statusText: event.target.statusText
                        }),
                        category: 'network',
                        level: 'error',
                        create: "ajax check",
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
    handleConsoleError(_window, config) {
        if (!_window.console || !_window.console.error) return;
        let _oldConsoleError = _window.console.error;
        _window.console.error = function () {
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(arguments.join(',')),
                category: 'js',
                level: 'error',
                create: "consoleError"
            });
            _oldConsoleError && _oldConsoleError.apply(_window, arguments);
        };
    };

    //处理console warning
    handleConsoleWarnning(_window, config) {
        if (!_window.console || !_window.console.warn) return;
        let _oldConsoleWarn = _window.console.warn;
        _window.console.warn = function () {
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify(arguments.join(",")),
                category: 'js',
                level: 'warning',
                create: "'console warning'",
            });
            _oldConsoleWarn && _oldConsoleWarn.apply(_window, arguments);
        };
    };

    handleVueError(_window, config) {
        var vue = _window.Vue || _window.vue;
        if (!vue || !vue.config) return; // 没有找到vue实例
        var _oldVueError = vue.config.errorHandler;
        Vue.config.errorHandler = function VueErrorHandler(error, vm, info) {
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
                msg: error.stack,
                data: metaData,
                category: 'js',
                level: 'error',
                create: 'vue Error',
            });

            if (_oldVueError && isFunction(_oldVueError)) {
                _oldOnError.call(this, error, vm, info);
            }
        };
    };

    handleVueWarn(_window, config) {
        var vue = _window.Vue || this.config.Vue;
        if (!vue || !vue.config) {
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
            config.sendError({
                title: _window.location.href,
                create: 'vue Warn',
                msg: msg.stack,
                data: JSON.stringify(metaData),
                category: 'js',
                level: 'warn',
            });

            if (_oldVueWarn && isFunction(_oldVueWarn)) {
                _oldVueWarn.call(this, error, vm, info);
            }
        };
        vue.config.warnHandler = VueWarnHandler
    }

    //自定义抛出错误
    ThrowError(err, addition) {
        if (addition) {
            for (let i in addition) {
                err[i] = addition[i]
            }
        }
        console.log(err)
        self.config.sendError(err)
    }

    getBrowser() {
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
    getDevices() {
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
    getSystemVersion() {
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