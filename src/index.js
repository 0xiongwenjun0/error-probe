import explorer from './firEye-probe';
let submitUrl='http://127.0.0.1:7001/api/errors';
explorer.start({
    submitUrl:submitUrl,
    record:true,//是否开启录制，默认为false
    sendError:(error)=>{
        /*如果需要录制功能*/
        console.log(`window.recordEvent`,window.recordEvent);
        if(window.recordEvent){
            if(window.recordEvent.lenght>=30){
                error.records=window.recordEvent;
            }else {
                error.records=window.eventBackUp.concat(window.recordEvent);
            }
        }
        fetch(submitUrl,{
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'appId':'7d21d390-0aa2-11ea-b529-ebb1675f5f6f',
                'appScrect':'7d21faa0-0aa2-11ea-b529-ebb1675f5f6f'
            },
            body:JSON.stringify(error),
        }).then(res => {
                // console.log(res)
            })
            .catch(error => console.error('Error:', error));
    }
});