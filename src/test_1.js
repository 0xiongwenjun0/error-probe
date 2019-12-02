import { record, Replayer } from 'rrweb'
const DIVITION="/$#$/"
class explorer {
    constructor() {
        this.defaultInfo = {
            ua: window.navigator.userAgent,
            browser: this.getBrowser(),//浏览器
            os: this.getDevices(),//操作系统
            osVersion: this.getSystemVersion(),//操作系统版本
            errUrl: window.location.href,//url
        }//默认错误信息上报
        this.config = {
            jsError: true,//js错误
            resourceError: true,//
            ajaxError: true,//ajax错误
            consoleError: true, // console.error处理
            scriptError: true, // 跨域js错误，默认不处理，因为没有任何信息
            vue: true,//vue错误问题
            autoReport: true,
            PageCrash: false,//监听页面崩溃
            custom:true,//自定义抛出接口
            heartTime: 5,//默认监听间隔
            filters: [], // 过滤器，命中的不上报
            levels: ['info', 'warning', 'error', 'dead'],
            category: ['js', 'resource', 'ajax'],
            record: false,//是否录制
            submitUrl: "http://fireye.tdahai.com/api/error",//默认提交的地址
            Vue: null,
            pushlength: 30,
            appId: "",//在frontend-sniper-admin管理后台创建应用的appId
            appScrect: "",//在frontend-sniper-admin管理后台创建应用的appScrect
            sendError: (obj, level) => {
                var error = Object.assign(obj, this.defaultInfo)
                if (level !== "error" || level !== "dead") {
                    this.noteList.push(error)
                    if (this.noteList.length >= this.config.pushlength) {
                        this.pushToServer(this.noteList)
                    }
                } else {
                    this.pushToServer(error)
                }
            },//错误发送地点
        };
        this._window = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
        this.addEventListener = this._window.addEventListener || this._window.attachEvent;//自定义事件
        this._window.recordEvent = [];//录制事件
        this._window.eventBackUp = [];//录制时间备份
        this.noteList = []//错误事件存储
    }

    isFunction(what) { return typeof what === 'function'; }
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

    pushToServer(data) {
        // if (this.ENV === "dev" || this.ENV === "development") {
        //     return;
        // }
        if (data instanceof Array) {
            fetch(this.config.submitUrl, {
                method: "POST",
                headers: {
                    appId: this.config.appId,
                    appScrect: this.config.appScrect
                },
                body:data.map(item=>JSON.stringify(item)).join(DIVITION)
            })
            //推送一个数组
            return;
        } else {
            fetch(this.config.submitUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    "appId": this.config.appId,
                    "appScrect": this.config.appScrect
                },
                body: JSON.stringify(data)
            }).then(res => {
            })
            //推送一个重要的错误对象
            return;
        }
    }

    /*开始监控*/
    start(options) {
        this.config = Object.assign(this.config, options)//合并配置
        if (!this.config.scriptError) {
            this.config.filters.push(function () { return /^Script error\.?$/.test(arguments[0]); })
        }

        // 开始录制
        if (this.config.record) {
            // debugger;
            console.log('=====开始录制=====');
            this.startRecord();
        }

        // 处理过滤器

        if (this.config.jsError) {
            this.handleWindowError(this._window, this.config);
        }
        if (this.config.jsError) {
            // https://developer.mozilla.org/zh-CN/docs/Web/Events/unhandledrejection
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
        }
        if (this.config.vue) {
            this.handleVueError(this._window, this.config);
            // if (this.config.ENV === "dev" || this.config.ENV === "development")
            this.handleVueWarn(this._window, this.config)
        }
        if (this.config.PageCrash) {
            this.handlePageCrash(this._window, this.config)
        }
    }

    ThrowError(error, addition) {
        this.config.sendError(Object.assign(error, addition), "error")
    }

    //开始录制
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
                    title: msg,
                    msg: error.stack,
                    category: 'js',
                    level: 'error',
                    line: line,
                    col: col,
                });
            } else if (typeof msg === 'string') {
                config.sendError({
                    title: msg,
                    msg: JSON.stringify({
                        resourceUrl: url,
                        line: line,
                        col: col
                    }),
                    category: 'js',
                    level: 'error'
                });
            }
            if (_oldWindowError && isFunction(_oldWindowError)) {
                _oldWindowError.apply(window, arguments);
            }
        }
    }

    /*监听Promise Reject错误*/
    handleRejectPromise(_window, config) {
        _window.addEventListener('unhandledrejection', function (event) {
            if (event) {
                let reason = event.reason;
                config.sendError({
                    title: 'unhandledrejection',
                    msg: reason,
                    category: 'js',
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
                    title: target.nodeName,
                    msg: url,
                    category: 'resource',
                    level: 'error',
                });
            }
        }, true);
    };

    /*监听fetch请求错误*/
    _handleFetchError(_window, config) {
        if (!_window.fetch) return;
        let _oldFetch = _window.fetch;
        _window.fetch = function () {
            return _oldFetch.apply(this, arguments)
                .then(res => {
                    if (!res.ok) { // True if status is HTTP 2xx
                        if(res.url===config.submitUrl){
                            console.log('提交错误报错，请检查后台firEye-server是否运行正常');
                        }else{
                            config.sendError({
                                title: arguments[0],
                                msg: JSON.stringify(res),
                                category: 'fetch',
                                level: 'error'
                            });
                        }
                    }
                    return res;
                })
                .catch(error => {
                    config.sendError({
                        title: arguments[0],
                        msg: JSON.stringify({
                            message: error.message,
                            stack: error.stack
                        }),
                        category: 'fetch',
                        level: 'error',
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
                    console.log('提交错误报错，请检查后台firEye是否运行正常');
                } else {
                    config.sendError({
                        title: event.target.responseURL,
                        msg: JSON.stringify({
                            response: event.target.response,
                            responseURL: event.target.responseURL,
                            status: event.target.status,
                            statusText: event.target.statusText
                        }),
                        category: 'ajax',
                        level: 'error',
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
        _window.console.error = function (error, ...args) {
            config.sendError({
                title: 'consoleError',
                msg: {
                    error
                },
                category: 'js',
                level: 'error',
            });
            _oldConsoleError && _oldConsoleError.apply(_window, arguments);
        };
    };
    //处理console warnning
    handleConsoleWarnning(_window, config) {
        if (!_window.console || !_window.console.warn) return;
        let _oldConsoleWarn = _window.console.warn;
        _window.console.warn = function (warning, ...args) {
            config.sendError({
                title: 'console warnning',
                msg: {
                    warning
                },
                category: 'js',
                level: 'warnning',
            });
            _oldConsoleWarn && _oldConsoleWarn.apply(_window, arguments);
        };
    };

    handleVueError(_window, config) {
        var vue = _window.Vue || this.config.Vue;
        if (!vue || !vue.config) {
            return
        } // 没有找到vue实例
        var _oldVueError = vue.config.errorHandler;
        function VueErrorHandler(error, vm, info) {
            var metaData = {};
            if (Object.prototype.toString.call(vm) === '[object Object]') {
                metaData.componentName = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name;
                metaData.propsData = vm.$options.propsData;
            }
            config.sendError({
                title: 'vue Error',
                msg: error,
                data: metaData,
                info: info,
                category: 'js',
                level: 'error',
            });
            if (_oldVueError && isFunction(_oldVueError)) {
                _oldVueError.call(this, error, vm, info);
            }
        };
        vue.config.errorHandler = VueErrorHandler
        vue.config.errorCaptured = VueErrorHandler
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
            config.sendError({
                title: 'vue Warn',
                msg: msg,
                data: metaData,
                info: info,
                category: 'js',
                level: 'warn',
            });

            if (_oldVueWarn && isFunction(_oldVueWarn)) {
                _oldVueWarn.call(this, error, vm, info);
            }
        };
        vue.config.warnHandler = VueWarnHandler
    }
    //监听页面崩溃函数
    async handlePageCrash(_window, config) {
        if (!_window.navigator.serviceWorker) {
            return;
        }
        await _window.navigator.serviceWorker.register("/serviceWorker.js", { scope: './' })
        let HEARTBEAT_INTERVAL = 1000 * config.heartTime; // 每五秒发一次心跳
        let sessionId = config.appId || "dev app";
        let heartbeat = function () {
            navigator.serviceWorker.controller.postMessage({
                type: 'heartbeat',
                id: sessionId,
                data: {} // 附加信息，如果页面 crash，上报的附加数据
            });
        }
        window.addEventListener("beforeunload", function () {
            navigator.serviceWorker.controller.postMessage({
                type: 'unload',
                id: sessionId
            });
        });
        setInterval(heartbeat, HEARTBEAT_INTERVAL);
        heartbeat();
    }
}



export default new explorer();