let ws;
window.addEventListener('DOMContentLoaded',()=>{
    ws = new WebSocket('ws://localhost:3000/ws');
    ws.addEventListener('open',onConnectionOpen);
    ws.addEventListener('message',onMessageReceived);
    // console.log(queryParams);

})
function getQueryParams(){
    const search = window.location.search.substring(1);
    const pairs = search.split('&');
    let params = {};
    pairs.forEach( pair => {
        const parts = pair.split('=');
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    })
    return params;
}
// conn opened
function onConnectionOpen(){
    console.log('opened');
    const queryParams = getQueryParams();
    if(queryParams.name && queryParams.group)
    {
        const event = {
            event: 'join',
            group: queryParams.group,
            name: queryParams.name,
        }
        // console.log(event);
        ws.send(JSON.stringify(event));
    }
    else{
        window.location.href = 'chat.html';
        return;
    }

}

function onMessageReceived(event){
    console.log('received');
    const data = JSON.parse(event.data);
    console.log(data);
}