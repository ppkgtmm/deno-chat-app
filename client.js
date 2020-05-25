let ws;
let chatUsers = document.querySelector('#chatUsers');
let count = document.querySelector('#chatUsersCount');
let msgForm = document.querySelector('#messageSendForm');
let msgInput = document.querySelector('#messageInput');
let chatMsg = document.querySelector('#chat-messages');
let groupName = document.querySelector('#groupName');
let leaveBtn = document.querySelector('#leaveGroupBtn');

window.addEventListener('DOMContentLoaded',()=>{
    ws = new WebSocket('ws://localhost:3000/ws');
    ws.addEventListener('open',onConnectionOpen);
    ws.addEventListener('message',onMessageReceived);
})

msgForm.onsubmit = (e) => {
    e.preventDefault();
   if(msgInput.value && msgInput.value.length>0){
    const event = {
        event: 'message',
        data: msgInput.value,
    }
    ws.send(JSON.stringify(event));
    console.log("form message",event);
    msgInput.value = '';
   }
}

leaveBtn.onclick = () => {
    window.location.href = 'chat.html';
}

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
        groupName.innerText = queryParams.group;
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
    switch(data.event){
        case 'users':
            chatUsers.innerHTML = '';
            data.data.forEach(user =>{
                const userEl = document.createElement('div');
                userEl.className = 'chat-user';
                userEl.innerHTML = user.name
                chatUsers.appendChild(userEl);
            })
            count.innerHTML = data.data.length;
            break;
        case 'message':
            const isDown = isAtBottom();
            appendMsg(data.data);
            if(isDown){
                chatMsg.scrollTop = chatMsg.scrollTop +  chatMsg.offsetHeight;
            }
            break;
        case 'previousMessages':
            data.data.forEach(item => {
                appendMsg(item);
            })
            break;
    }
}

function appendMsg(data){
    const msgElem = document.createElement('div');
    msgElem.className = `message message-${data.sender === 'me' ? 'to' : 'from'}`
    msgElem.innerHTML = ` <h4>${data.sender === 'me' ? '' : data.name}</h4>
                          <p class="message-text">${data.message}</p>`;
    chatMsg.appendChild(msgElem);
}

function isAtBottom() {
    if(Math.floor(chatMsg.offsetHeight + chatMsg.scrollTop) === chatMsg.scrollHeight){
        return true;
    }
    return false;
}