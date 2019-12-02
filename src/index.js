import explorer from './firEye-probe';
explorer.start({
    record:true,//是否开启录制，默认为false
    submitUrl:"http://127.0.0.1:7001/api/errors",
    appId: "7d21d390-0aa2-11ea-b529-ebb1675f5f6f",
    appScrect: "7d21faa0-0aa2-11ea-b529-ebb1675f5f6f",
});