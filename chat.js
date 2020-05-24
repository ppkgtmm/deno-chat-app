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
let usersMap = new Map();

/**
 * groupName: [user1,user2,..]
 * {
 *  userID : string,
 *  name: string,
 *  ws: WebSocket
 * } 
 */
let groups = new Map();

function getDisplayUsers(group) {
    const users = groups.get(group) || [];
    return users.map(user =>{
        return {
            userId: user.userId,
            name: user.name,
        }
    })
}
function emitEvent(group) {
    const users = groups.get(group) || [];
    users.forEach((user) => {
            const event = {
                event: 'users',
                data: getDisplayUsers(group)
            }
            user.ws.send(JSON.stringify(event));
    });
}
export default async function chat(ws){
    console.log('connected');
    const userId = v4.generate();
    //wait for data
    for await (let data of ws){
       if(isWebSocketCloseEvent(data)){
        const user = usersMap.get(userId);
        if(!user){
            return;
        }
        let users = groups.get(user.group) || [];
        users = users.filter((u) => u.userId!== user.userId);
        groups.set(user.group, users);
        usersMap.delete(userId);
        // console.log(users);
        emitEvent(user.group);
        break;
       }
       const event = typeof data === 'string'? JSON.parse(data) : data;
        switch(event.event){
            case 'join':
                const user = {
                    userId,
                    name: event.name,
                    group: event.group,
                    ws,
                }
                usersMap.set(userId,user);
                let users = groups.get(event.group) || [];
                users.push(user);
                groups.set(event.group,users);
                emitEvent(event.group);
                break;
            
                
        }
    }
}