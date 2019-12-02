import explorer from './firEye-probe';
explorer.start({
    record:true,//是否开启录制，默认为false
    submitUrl:"http://127.0.0.1:7001/api/errors"
});