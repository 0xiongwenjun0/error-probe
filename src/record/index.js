import { record } from 'rrweb'
function _startRecord(window) {
    record({
        emit: (event) => {
            /*
            如果事件大于30时，先备份再清空，以防出现错误时，事件过少无法还原错误发生过程，此时可从备份取回部分录制事件
            */
            if (window.recordEvent.length >= 100) {
                window.eventBackUp = JSON.parse(JSON.stringify(window.recordEvent));
                window.recordEvent = [];
            } else {
                window.recordEvent.push(event);
            }
            // 用任意方式存储 event
        },
    });
}

export default _startRecord
