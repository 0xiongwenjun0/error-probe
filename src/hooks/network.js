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

    let XMLHttpRequest = _window.XMLHttpRequest;

    let _oldOpen = XMLHttpRequest.prototype.open;

    let _oldSend = XMLHttpRequest.prototype.send;

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

    XMLHttpRequest.prototype.open = function (type, url) {
        currentType = type;
        currentUrl = url;
        _oldOpen.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function () {
        if (this['addEventListener']) {
            this['addEventListener']('error', _handleEvent);
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

export {
    _handleFetchError,
    _handleAjaxError,
}