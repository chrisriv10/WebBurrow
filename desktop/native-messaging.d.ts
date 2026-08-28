export const EXTENSION_ID:string;
export function encodeNativeMessage(message:unknown):Buffer;
export function decodeNativeMessage(frame:Buffer):unknown;
