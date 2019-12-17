function isObject(what) { return Object.prototype.toString.call(what) === "[object Object]" }
function isFunction(what) { return typeof what === 'function'; }
//获取额外字段
function _getExtend(extend) {
    if (isFunction(extend)) {
        let result = extend()
        if (isObject(result))
            return result
        else return {}
    } else if (isObject(extend)) {
        for (let key in extend) {
            if (isFunction(extend[key])) {
                extend[key] = extend[key]()
            }
        }
        return extend
    } else {
        return {}
    }
}

export {
    _sendToServer,
    _getExtend,
    isObject,
    isFunction
}