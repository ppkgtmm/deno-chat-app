import { listenAndServe } from 'https://deno.land/std/http/server.ts';
import {
    acceptWebSocket,
    acceptable,
  } from 'https://deno.land/std/ws/mod.ts';
import chat from './chat.js'
listenAndServe({port: 3000}, async req => {
    // check if websocket request
    if(acceptable(req)){
        acceptWebSocket({
            connection: req.connection,
            bufReader: req.r,
            bufWriter: req.w,
            headers: req.headers,

        }).then(chat);
    }
})
