import { _window, defaultInfo, warnList, FailErrorList } from "../redux"
import { _getExtend, _sendToServer } from "../util"
import { executePublic, executePrivate } from "../middleware"
const config = {
    submitUrl: url,
    jsError: true,
    resourceError: true,
    ajaxError: true,
    consoleError: false, // console.error默认不处理
    scriptError: true, // 跨域js错误，默认不处理，因为没有任何信息
    autoReport: true,
    Vue: null,
    custom: true,//自定义抛出
    closeWarn: false,//是否停止监听Warn
    filters: [], // 过滤器，命中的不上报
    levels: ['info', 'warning', 'error'],
    category: ['js', 'resource', 'ajax', 'log'],
    record: false,//是否录制F
    uploadWarnLength: 30,//默认上传的最低长度
    appId: "",
    appScrect: ""
};

config.sendError = (error) => {
    /*如果需要录制功能*/
    if (error.category === 'js' && _window.recordEvent) {
        if (_window.recordEvent.lenght >= 30) {
            error.records = _window.recordEvent;
        } else {
            error.records = _window.eventBackUp.concat(_window.recordEvent);
        }
    }
    //添加默认数据
    for (let i in defaultInfo) {
        error[i] = defaultInfo[i];
    }
    //添加自定义数据
    if (config.extends) {
        if (!error.extends)
            error.extends = {}
        let result = _getExtend(config.extends)
        error.extends = Object.assign(error.extends, result)
    }
    executePublic(error)
    executePrivate(error)
    _sendToServer(error)
}
config.sendWarn = (warn, send) => {
    if (!send) {
        //添加默认数据
        for (let i in defaultInfo) {
            warn[i] = defaultInfo[i];
        }
        //添加自定义数据
        if (config.extends) {
            if (!warn.extends)
                warn.extends = {}
            let result = _getExtend(config.extends)
            warn.extends = Object.assign(warn.extends, result)
        }
        warnList.push(warn)
        //判断是否到达上传的长度
        if (warnList.length < config.uploadWarnLength) {
            return
        }
    }
    //上报警告信息
    if (warnList.length + FailErrorList.length > 0) {
        let arr = warnList.concat(FailErrorList)
        _sendToServer(arr)
    }
}

config.sendLog = (info) => {
    info.title = _window.location.href;
    info.category = "log";
    _sendToServer(info)
}

function setConfig(change) {
    for (let key in change) {
        config[key] = change[key];
    }
}

export {
    setConfig,
    config,
}
