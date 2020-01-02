/*监听资源错误*/
function _handleResourceError(_window, config) {
    _window.addEventListener('error', function (event) {
        if (event) {
            let target = event.target || event.srcElement;
            let type = null;
            if (target instanceof HTMLScriptElement) {
                type = "Script标签"
            } else if (target instanceof HTMLLinkElement) {
                type = "Link标签"
            } else if (target instanceof HTMLImageElement) {
                type = "Image标签"
            }
            if (type === null) return;//js 错误不处理
            let url = target.src || target.href;
            if (_window.location.href.indexOf(url) >= 0) return;
            config.sendError({
                title: _window.location.href,
                msg: JSON.stringify({
                    url,
                    type
                }),
                category: 'resource',
                level: "error",
                extends: {}
            });
        }
    }, true);
};

export {
    _handleResourceError,
}