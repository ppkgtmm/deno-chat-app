import { v4 } from 'https://deno.land/std/uuid/mod.ts';
import { isWebSocketCloseEvent } from 'http://deno.land/std/ws/mod.ts';
/**
 * userID: {
     userID : string,
     name: string,
     group: string,
     ws: WebSocket
 } 
 */
const usersMap = new Map();

/**
 * groupName: [user1,user2,..]
 * {
 *  userID : string,
 *  name: string,
 *  ws: WebSocket
 * } 
 */
const groups = new Map();

/**
 * groupName : [msg1,msg2]
 * {
 *  userId,
 *  name,
 *  message
 * }
 */
const msg = new Map();
function getDisplayUsers(group) {
    const users = groups.get(group) || [];
    return users.map(user =>{
        return {
            userId: user.userId,
            name: user.name,
        }
    })
}
function emitUserList(group) {
    const users = groups.get(group) || [];
    users.forEach((user) => {
            if(user.ws.readyState === user.ws.OPEN) {
                const event = {
                    event: 'users',
                    data: getDisplayUsers(group)
                }
                user.ws.send(JSON.stringify(event));
            }
    });
}

function emitMessage(group,msg,senderId) {
    const users = groups.get(group) || []; 
    const tempMessage = {
        ...msg,
    }
    users.forEach((user) => {
            tempMessage.sender = user.userId === senderId ? 'me' : user.userId
            const event = {
                event: 'message',
                data: tempMessage,
            }
            user.ws.send(JSON.stringify(event));
    });
}

function emitPreviousMsg(group,ws) {
    const messages = msg.get(group) || [];
    const event = {
        event: 'previousMessages',
        data : messages,
    }
    ws.send(JSON.stringify(event));
}

function userLeave(userId){
    const user = usersMap.get(userId);
        if(!user){
            return;
        }
    let users = groups.get(user.group) || [];
    users = users.filter((u) => u.userId!== user.userId);
    groups.set(user.group, users);
    usersMap.delete(userId);
    emitUserList(user.group);
}
let user;
export default async function chat(ws){
    console.log('connected');
    const userId = v4.generate();
    //wait for data
    for await (let data of ws){
       if(isWebSocketCloseEvent(data)){
        userLeave(userId);
        break;
       }
       const event = typeof data === 'string'? JSON.parse(data) : data;
        switch(event.event){
            case 'join':
                user = {
                    userId: userId,
                    name: event.name,
                    group: event.group,
                    ws,
                }
                usersMap.set(userId,user);
                let users = groups.get(event.group) || [];
                users.push(user);
                groups.set(event.group,users);
                emitUserList(event.group);
                emitPreviousMsg(event.group,ws);
                break;
            case 'message':
                user = usersMap.get(userId) || [];
                const message = {
                    userId,
                    name: user.name,
                    message: event.data,
                }
                const messages = msg.get(user.group) || [];
                messages.push(message);
                msg.set(user.group,messages);
                emitMessage(user.group,message,userId);
                break;
        }
    }
}