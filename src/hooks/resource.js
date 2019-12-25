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

export {
    _handleResourceError,
}