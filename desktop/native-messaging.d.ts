export const EXTENSION_ID:string;
export function encodeNativeMessage(message:unknown):Buffer;
export function decodeNativeMessage(frame:Buffer):unknown;
export function startNativeMessageServer(app:unknown,dispatch:(message:unknown)=>unknown):{close:()=>void;focus:(url:string)=>Promise<boolean>};
