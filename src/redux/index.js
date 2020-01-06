const _window = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof this !== 'undefined' ? this : {};
const addEventListener = _window.addEventListener || _window.attachEvent;
let warnList = [];
const FailErrorList = []
_window.recordEvent = [];//录制事件
_window.eventBackUp = [];//录制时间备份
const defaultInfo = {
    browser: _getBrowser(),//浏览器
    os: _getDevices(),//操作系统
    osVersion: _getSystemVersion(),//操作系统版本
    memory: _window.navigator.deviceMemory,//获取用户的最大内存 G
}//默认错误信息上报

function resetWarnList() {
    warnList = []
}

function pushFailErrorList(info){
    if(Array.isArray(info)){
        FailErrorList.push(...info)
    }else{
        pushFailErrorList.push(info)
    }
}

//获取浏览器信息
function _getBrowser() {
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
function _getDevices() {
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
        return navigator.platform
    }
}
//获取操作系统版本
function _getSystemVersion() {
    var ua = window.navigator.userAgent
    if (ua.indexOf('CPU iPhone OS ') >= 0) {
        return ua.substring(ua.indexOf('CPU iPhone OS ') + 14, ua.indexOf(' like Mac OS X'))
    } else if (ua.indexOf('Android ') >= 0) {
        return ua.substr(ua.indexOf('Android ') + 8, 3)
    } else {
        return 'other'
    }
}

export {
    _window,
    addEventListener,
    warnList,
    resetWarnList,
    FailErrorList,
    defaultInfo,
    pushFailErrorList
}