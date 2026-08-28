import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { safeStorage } from 'electron';
import { parseNativeMessage } from './native-contract.mjs';

export const EXTENSION_ID = 'igfepplhdmogifjmgfligakhgoacflhg';
const ORIGIN = `chrome-extension://${EXTENSION_ID}/`;

function locations(app) {
  const suffix = crypto.createHash('sha256').update(app.getPath('userData')).digest('hex').slice(0, 16);
  return { pipe:`\\\\.\\pipe\\webburrow-${suffix}`, token:path.join(app.getPath('userData'), 'native-host-token.bin') };
}

function installationToken(app) {
  const { token } = locations(app);
  try { return safeStorage.decryptString(fs.readFileSync(token)); } catch {}
  const value = crypto.randomBytes(32).toString('base64url');
  fs.mkdirSync(path.dirname(token), { recursive:true });
  fs.writeFileSync(token, safeStorage.encryptString(value), { mode:0o600 });
  return value;
}

export function startNativeMessageServer(app, dispatch) {
  const { pipe } = locations(app); const token = installationToken(app);const clients=new Set();const authenticatedClients=new Set();const pending=new Map();const recentRequests=new Map();
  const server = net.createServer(socket => {
    let buffer = '';
    clients.add(socket);socket.on('close',()=>{clients.delete(socket);authenticatedClients.delete(socket);});
    socket.setEncoding('utf8');
    socket.on('data', chunk => {
      buffer += chunk;
      if (buffer.length > 2_100_000) return socket.destroy();
      for (;;) {
        const lineEnd = buffer.indexOf('\n'); if (lineEnd < 0) break;
        const line = buffer.slice(0, lineEnd); buffer = buffer.slice(lineEnd + 1);
        try {
          const envelope = JSON.parse(line);if(envelope.token!==token)throw new Error('Rejected native-host token.');const message=parseNativeMessage(envelope.message);const now=Date.now();for(const[id,time]of recentRequests)if(now-time>60_000)recentRequests.delete(id);if(recentRequests.has(message.requestId))throw new Error('Replayed native message.');recentRequests.set(message.requestId,now);authenticatedClients.add(socket);
          if(message.type==='focus-or-open-result'){const resolver=pending.get(message.requestId);pending.delete(message.requestId);resolver?.(message.handled===true);continue;}
          Promise.resolve(dispatch(message)).then(result=>socket.write(`${JSON.stringify({requestId:message.requestId,ok:true,...(result===undefined?{}:{result})})}\n`)).catch(error=>socket.write(`${JSON.stringify({requestId:message.requestId,ok:false,error:{code:'dispatch-error',message:String(error?.message||'The request could not be applied.').slice(0,240)}})}\n`));
        } catch (error) { socket.write(`${JSON.stringify({ ok:false, error:{ code:'invalid-message', message:error.message } })}\n`); }
      }
    });
  });
  server.on('error', () => {}); server.listen(pipe);
  return {close:()=>server.close(),focus:url=>new Promise(resolve=>{const client=[...authenticatedClients].find(socket=>!socket.destroyed);if(!client)return resolve(false);const requestId=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(requestId);resolve(false);},850);pending.set(requestId,handled=>{clearTimeout(timer);resolve(handled);});client.write(`${JSON.stringify({type:'focus-or-open',requestId,url})}\n`);})};
}

function readNativeFrames(stream, onMessage) {
  let pending = Buffer.alloc(0);
  stream.on('data', chunk => {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= 4) {
      const size = pending.readUInt32LE(0); if (size > 2_100_000) process.exit(1);
      if (pending.length < size + 4) break;
      const body = pending.subarray(4, size + 4); pending = pending.subarray(size + 4);
      try { onMessage(JSON.parse(body.toString('utf8'))); } catch { writeNative({ ok:false, error:{ code:'malformed-json', message:'Invalid native message.' } }); }
    }
  });
}

export function encodeNativeMessage(message) { const body=Buffer.from(JSON.stringify(message));const frame=Buffer.alloc(body.length+4);frame.writeUInt32LE(body.length,0);body.copy(frame,4);return frame; }
export function decodeNativeMessage(frame) { if(!Buffer.isBuffer(frame)||frame.length<4)throw new Error('Incomplete native message.');const size=frame.readUInt32LE(0);if(size>2_100_000||frame.length!==size+4)throw new Error('Invalid native message length.');return JSON.parse(frame.subarray(4).toString('utf8')); }
function writeNative(message) { process.stdout.write(encodeNativeMessage(message)); }

export function runNativeHostClient(app) {
  const origin = process.argv.find(value => value.startsWith('chrome-extension://'));
  if (origin !== ORIGIN) { writeNative({ ok:false, error:{ code:'origin-denied', message:'This extension is not allowed.' } }); return app.exit(1); }
  const { pipe } = locations(app); const token = installationToken(app);const socket=net.createConnection(pipe);let reply='';
  socket.setEncoding('utf8');socket.on('data',chunk=>{reply+=chunk;for(;;){const end=reply.indexOf('\n');if(end<0)break;try{writeNative(JSON.parse(reply.slice(0,end)));}catch{writeNative({ok:false,error:{code:'bridge-error',message:'Invalid desktop response.'}});}reply=reply.slice(end+1);}});
  socket.on('error',()=>writeNative({ok:false,error:{code:'not-running',message:'Open WebBurrow and try again.'}}));
  readNativeFrames(process.stdin,message=>{try{socket.write(`${JSON.stringify({token,message:parseNativeMessage(message)})}\n`);}catch(error){writeNative({ok:false,error:{code:'invalid-message',message:String(error?.message||'Invalid native message.').slice(0,240)}});}});
}
