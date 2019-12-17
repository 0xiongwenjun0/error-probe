import { _window } from "../redux"
import { record } from 'rrweb'
function _startRecord() {
    record({
        emit: (event) => {
            /*
            如果事件大于30时，先备份再清空，以防出现错误时，事件过少无法还原错误发生过程，此时可从备份取回部分录制事件
            */
            if (_window.recordEvent.length >= 100) {
                _window.eventBackUp = JSON.parse(JSON.stringify(_window.recordEvent));
                _window.recordEvent = [];
            } else {
                _window.recordEvent.push(event);
            }
            // 用任意方式存储 event
        },
    });
}

export default _startRecord
